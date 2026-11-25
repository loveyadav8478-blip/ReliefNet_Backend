package com.hackathon.resourceallocation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Text analysis for a reported need.
 *
 * Pipeline: detect language → translate if needed → local keyword analysis →
 * Gemini analysis (if configured) → merge both into one result.
 * The local pass is the fallback, so the endpoint keeps working without an API key.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AIService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public record AIAnalysisResult(
            // Core
            String category,
            String urgency,
            int priorityScore,

            // Confidence
            double categoryConfidence,
            double urgencyConfidence,
            double overallConfidence,
            String confidenceLabel,

            // Explainability
            String reasoning,
            List<String> matchedKeywords,
            List<String> alternateCategories,

            // Skills
            String suggestedSkills,

            // Location
            String aiDetectedLocation,
            double locationConfidence,

            // People
            Integer peopleAffected,

            // Language
            String detectedLanguage,
            String translatedText,

            // Pipeline metadata
            boolean analysisSuccessful,
            boolean aiUsedFallback,
            List<String> aiWarnings
    ) {}

    // ─────────────────────────────────────────────────────────────
    // KEYWORD TAXONOMY
    // ─────────────────────────────────────────────────────────────

    private static final Map<String, List<String>> CATEGORY_KEYWORDS = Map.of(
            "FOOD", List.of("food", "meal", "hungry", "hunger", "starvation", "starving", "eat", "rice",
                    "wheat", "ration", "malnutrition", "malnourished", "feeding", "bhojan",
                    "khaana", "roti", "rasad", "bhookha"),
            "MEDICAL", List.of("medical", "medicine", "hospital", "injur", "sick", "sickness", "pain",
                    "insulin", "blood", "doctor", "nurse", "health", "disease", "epidemic",
                    "outbreak", "cholera", "malaria", "dengue", "fever", "treatment", "surgery",
                    "dawai", "dawa", "bimari", "aushadhi", "ilaaj", "sehat", "aspatal"),
            "SHELTER", List.of("shelter", "home", "house", "roof", "sleep", "flood", "fire", "displacement",
                    "displaced", "homeless", "tent", "tarpaulin", "relief camp", "refugee",
                    "aashray", "ghar", "makaan", "chhat", "visthapit"),
            "WATER", List.of("water", "drink", "contamin", "borewell", "tanker", "pipeline", "drought",
                    "dehydration", "sanitation", "hygiene", "sewage", "pani", "paani", "jal",
                    "sukha", "pyaas"),
            "OTHER", List.of("streetlight", "electricity", "road", "bridge", "power", "signal",
                    "internet", "communication", "logistics", "infrastructure", "light",
                    "cable", "network", "transport", "drainage", "garbage", "waste",
                    "bijli", "sadak", "nali", "kachra")
    );

    private static final Map<String, List<String>> URGENCY_KEYWORDS = Map.of(
            "CRITICAL", List.of("dying", "death", "deaths", "life-threatening", "critical", "sos",
                    "hours", "immediate", "immediately", "emergency", "aapatkaal"),
            "HIGH", List.of("urgent", "urgently", "severe", "serious", "danger", "quickly",
                    "days", "child", "children", "sankat", "tatkal"),
            "MEDIUM", List.of("soon", "needed", "lacking", "shortage", "insufficient", "missing",
                    "zarurat", "kami", "jaldi"),
            "LOW", List.of("planning", "future", "proposal", "awareness", "research", "initiative")
    );

    private static final String[] CATEGORIES = {"FOOD", "MEDICAL", "SHELTER", "WATER", "OTHER"};
    private static final String[] URGENCIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"};

    private static final String ANALYSIS_PROMPT = """
            You are an emergency response AI for an NGO disaster coordination system.
            Analyze the following community need and respond ONLY in valid JSON.
            Do not include markdown, backticks, or any extra text.

            Language detected: %s
            Need Title: %s
            Description: %s

            Respond with EXACTLY this JSON structure:
            {
              "category": "FOOD|MEDICAL|SHELTER|WATER|OTHER",
              "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
              "priority_score": <integer 1-100>,
              "category_confidence": <float 0.0-1.0>,
              "urgency_confidence": <float 0.0-1.0>,
              "reasoning": "<one sentence explaining urgency assessment>",
              "suggested_skills": "<comma-separated: e.g. medical,driving,food_distribution>",
              "alternate_categories": "<comma-separated runner-up categories or empty>",
              "location": "<any location name mentioned in the text, or empty string>",
              "people_affected": <integer or -1 if unknown>,
              "warnings": "<any concerns about data quality or ambiguity, or empty string>"
            }
            """;

    // ─────────────────────────────────────────────────────────────
    // PUBLIC ENTRY POINT
    // ─────────────────────────────────────────────────────────────

    public AIAnalysisResult analyzeNeed(String title, String description) {
        List<String> warnings = new ArrayList<>();

        String combined = title + " " + description;
        String detectedLanguage = detectLanguage(combined);
        String translatedText = null;
        String processedText = combined;

        if ("hi".equals(detectedLanguage) || "mixed".equals(detectedLanguage)) {
            String translated = translateToEnglish(combined);
            if (translated != null) {
                translatedText = translated;
                processedText = translated;
                log.info("Translated ({}) text for analysis", detectedLanguage);
            } else {
                warnings.add("Hindi translation failed — processing original text");
            }
        }

        LocalAnalysis local = runLocalAnalysis(processedText, warnings);

        AIAnalysisResult geminiResult;
        try {
            geminiResult = callGemini(title, description, detectedLanguage, warnings);
        } catch (Exception e) {
            log.warn("Gemini call failed: {}", e.getMessage());
            warnings.add("Gemini API unavailable — fallback used");
            geminiResult = null;
        }

        return buildFinalResult(geminiResult, local, detectedLanguage, translatedText, warnings);
    }

    // ─────────────────────────────────────────────────────────────
    // GEMINI
    // ─────────────────────────────────────────────────────────────

    private AIAnalysisResult callGemini(String title, String description,
                                        String language, List<String> warnings) {
        String response = geminiClient.generate(
                ANALYSIS_PROMPT.formatted(language, title, description), 500, 0.1);
        return parseGeminiResponse(response, warnings);
    }

    private AIAnalysisResult parseGeminiResponse(String rawResponse, List<String> warnings) {
        try {
            JsonNode json = objectMapper.readTree(AiSupport.stripMarkdown(rawResponse));

            String category = AiSupport.sanitizeEnum(json.path("category").asText("OTHER"), CATEGORIES, "OTHER");
            String urgency = AiSupport.sanitizeEnum(json.path("urgency").asText("MEDIUM"), URGENCIES, "MEDIUM");

            double categoryConfidence = AiSupport.clamp(json.path("category_confidence").asDouble(0.7), 0, 1);
            double urgencyConfidence = AiSupport.clamp(json.path("urgency_confidence").asDouble(0.7), 0, 1);
            double overall = (categoryConfidence + urgencyConfidence) / 2.0;

            String location = json.path("location").asText("").trim();
            int people = json.path("people_affected").asInt(-1);

            String geminiWarning = json.path("warnings").asText("").trim();
            if (!geminiWarning.isEmpty()) {
                warnings.add("Gemini: " + geminiWarning);
            }

            // lang / translatedText are filled in by buildFinalResult
            return new AIAnalysisResult(
                    category, urgency,
                    AiSupport.clampInt(json.path("priority_score").asInt(50), 1, 100),
                    categoryConfidence, urgencyConfidence, overall,
                    AiSupport.confidenceLabel(overall),
                    json.path("reasoning").asText("AI analysis completed."),
                    List.of(),                       // keywords come from the local pass
                    AiSupport.parseCsv(json.path("alternate_categories").asText("")),
                    json.path("suggested_skills").asText(""),
                    location.isEmpty() ? null : location,
                    location.isEmpty() ? 0.0 : 0.85,
                    people < 0 ? null : people,
                    null, null,
                    true, false,
                    warnings
            );
        } catch (Exception e) {
            log.error("Gemini response parse failed: {}", e.getMessage());
            warnings.add("Gemini response parse error: " + e.getMessage());
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // LOCAL (KEYWORD) ANALYSIS
    // ─────────────────────────────────────────────────────────────

    private record LocalAnalysis(
            String category, double categoryConfidence, List<String> matchedKeywords,
            List<String> alternateCategories,
            String urgency, double urgencyConfidence,
            int priorityScore, String suggestedSkills,
            String location, double locationConfidence,
            Integer peopleAffected
    ) {}

    private LocalAnalysis runLocalAnalysis(String text, List<String> warnings) {
        String lower = text.toLowerCase();

        // ── Category scoring ──
        Map<String, Double> categoryScores = new LinkedHashMap<>();
        Map<String, List<String>> categoryHits = new LinkedHashMap<>();

        for (var entry : CATEGORY_KEYWORDS.entrySet()) {
            if ("OTHER".equals(entry.getKey())) continue;
            double score = 0;
            List<String> hits = new ArrayList<>();
            for (String keyword : entry.getValue()) {
                if (lower.contains(keyword)) {
                    score++;
                    hits.add(keyword);
                }
            }
            if (score > 0) {
                categoryScores.put(entry.getKey(), score);
                categoryHits.put(entry.getKey(), hits);
            }
        }

        String topCategory = "OTHER";
        double topScore = 0;
        List<String> topHits = List.of();
        List<String> alternateCategories = new ArrayList<>();

        if (!categoryScores.isEmpty()) {
            var sorted = categoryScores.entrySet().stream()
                    .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
                    .toList();
            topCategory = sorted.get(0).getKey();
            topScore = sorted.get(0).getValue();
            topHits = categoryHits.getOrDefault(topCategory, List.of());
            for (int i = 1; i < sorted.size(); i++) {
                if (sorted.get(i).getValue() >= topScore * 0.4) {
                    alternateCategories.add(sorted.get(i).getKey());
                }
            }
        }

        int keywordCount = CATEGORY_KEYWORDS.getOrDefault(topCategory, List.of()).size();
        double categoryConfidence = keywordCount > 0
                ? Math.min(topScore / Math.max(keywordCount * 0.4, 3), 1.0)
                : 0.0;
        if ("OTHER".equals(topCategory)) {
            warnings.add("Could not determine category — no keyword matches");
        }

        // ── Urgency ──
        String urgency = "LOW";
        double urgencyConfidence = 0.50;
        outer:
        for (String level : URGENCIES_REVERSED) {
            for (String keyword : URGENCY_KEYWORDS.getOrDefault(level, List.of())) {
                if (lower.contains(keyword)) {
                    urgency = level;
                    long hits = URGENCY_KEYWORDS.get(level).stream().filter(lower::contains).count();
                    urgencyConfidence = Math.min(0.60 + hits * 0.08, 1.0);
                    break outer;
                }
            }
        }

        int priorityScore = switch (urgency) {
            case "CRITICAL" -> AiSupport.clampInt(85 + (int) (categoryConfidence * 15), 1, 100);
            case "HIGH" -> AiSupport.clampInt(65 + (int) (categoryConfidence * 20), 1, 100);
            case "MEDIUM" -> AiSupport.clampInt(40 + (int) (categoryConfidence * 20), 1, 100);
            default -> AiSupport.clampInt(15 + (int) (categoryConfidence * 15), 1, 100);
        };

        String skills = suggestedSkillsFor(topCategory);

        // ── Location ──
        String location = extractLocation(text, lower);
        double locationConfidence = location == null ? 0.0 : (confidenceFor(text, location));
        if (location == null) {
            warnings.add("Location not detected in text");
        }

        // ── People count ──
        Integer people = AiSupport.extractPeopleCount(text);
        if (people == null) {
            warnings.add("No people count detected in text");
        }

        return new LocalAnalysis(topCategory, categoryConfidence, topHits, alternateCategories,
                urgency, urgencyConfidence, priorityScore, skills,
                location, locationConfidence, people);
    }

    private static final List<String> URGENCIES_REVERSED = List.of("CRITICAL", "HIGH", "MEDIUM", "LOW");

    private static String suggestedSkillsFor(String category) {
        return switch (category) {
            case "MEDICAL" -> "medical,first_aid,nursing,ambulance_driving";
            case "FOOD" -> "cooking,food_distribution,logistics";
            case "SHELTER" -> "construction,shelter_management,logistics";
            case "WATER" -> "water_supply,sanitation,logistics";
            default -> "logistics,driving,coordination";
        };
    }

    /** Looks for "in <City>" style phrases first, then any known city name. */
    private String extractLocation(String text, String lowerText) {
        Matcher matcher = Pattern.compile(
                "\\b(?:in|at|from|near|of|around)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})"
        ).matcher(text);

        while (matcher.find()) {
            String candidate = matcher.group(1);
            for (String city : AiSupport.INDIA_CITIES) {
                if (city.equalsIgnoreCase(candidate)) return city;
            }
        }

        for (String city : AiSupport.INDIA_CITIES) {
            if (lowerText.contains(city.toLowerCase())) return city;
        }
        return null;
    }

    private double confidenceFor(String text, String location) {
        Matcher matcher = Pattern.compile(
                "\\b(?:in|at|from|near|of|around)\\s+" + Pattern.quote(location)
        ).matcher(text);
        return matcher.find() ? 0.85 : 0.80;
    }

    // ─────────────────────────────────────────────────────────────
    // MERGE: Gemini + local
    // ─────────────────────────────────────────────────────────────

    private AIAnalysisResult buildFinalResult(AIAnalysisResult gemini, LocalAnalysis local,
                                              String language, String translatedText,
                                              List<String> warnings) {
        boolean usedFallback = (gemini == null);

        String category = gemini != null ? gemini.category() : local.category();
        String urgency = gemini != null ? gemini.urgency() : local.urgency();
        int score = gemini != null ? gemini.priorityScore() : local.priorityScore();
        String reasoning = gemini != null ? gemini.reasoning() : "Keyword-based fallback analysis";

        String skills = (gemini != null && !gemini.suggestedSkills().isBlank())
                ? gemini.suggestedSkills()
                : local.suggestedSkills();

        List<String> alternateCategories = (gemini != null && !gemini.alternateCategories().isEmpty())
                ? gemini.alternateCategories()
                : local.alternateCategories();

        // Average Gemini and local confidence for better calibration
        double categoryConfidence = gemini != null
                ? (gemini.categoryConfidence() + local.categoryConfidence()) / 2.0
                : local.categoryConfidence();
        double urgencyConfidence = gemini != null
                ? (gemini.urgencyConfidence() + local.urgencyConfidence()) / 2.0
                : local.urgencyConfidence();
        double overall = (categoryConfidence + urgencyConfidence + local.locationConfidence()) / 3.0;

        // Location: Gemini wins if found, else local, else null
        boolean geminiFoundLocation = gemini != null
                && gemini.aiDetectedLocation() != null
                && !gemini.aiDetectedLocation().isBlank();
        String aiLocation = geminiFoundLocation ? gemini.aiDetectedLocation() : local.location();
        double locationConfidence = geminiFoundLocation
                ? gemini.locationConfidence()
                : local.locationConfidence();

        // People: Gemini wins if found, else local regex
        Integer people = (gemini != null && gemini.peopleAffected() != null)
                ? gemini.peopleAffected()
                : local.peopleAffected();

        return new AIAnalysisResult(
                category, urgency, score,
                AiSupport.round2(categoryConfidence),
                AiSupport.round2(urgencyConfidence),
                AiSupport.round2(overall),
                AiSupport.confidenceLabel(overall),
                reasoning,
                local.matchedKeywords(),   // always from the local pass — more reliable
                alternateCategories,
                skills,
                aiLocation,
                AiSupport.round2(locationConfidence),
                people,
                language, translatedText,
                true, usedFallback,
                warnings
        );
    }

    // ─────────────────────────────────────────────────────────────
    // LANGUAGE DETECTION + TRANSLATION
    // ─────────────────────────────────────────────────────────────

    private String detectLanguage(String text) {
        boolean hasDevanagari = AiSupport.DEVANAGARI.matcher(text).find();
        boolean hasHindiRoman = text.toLowerCase().matches(
                ".*(khaana|bhojan|dawai|pani|paani|zarurat|tatkal|aapda|ghar|aspatal|sehat).*"
        );

        if (hasDevanagari && hasHindiRoman) return "mixed";
        if (hasDevanagari) return "hi";
        if (hasHindiRoman) return "mixed";
        return "en";
    }

    private String translateToEnglish(String text) {
        try {
            String prompt = "Translate the following Hindi or mixed Hindi-English text to clear English. "
                    + "Return ONLY the translated text, nothing else.\n\nText: " + text;
            return geminiClient.generate(prompt, 300, 0.1).trim();
        } catch (Exception e) {
            log.warn("Gemini translation failed: {}", e.getMessage());
            return null;
        }
    }
}
