package com.hackathon.resourceallocation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Vision analysis for image-based reports.
 * Sends the image to Gemini, then enriches the answer locally (location, people count,
 * defaults for missing fields). Falls back to a "manual review" result when the AI fails.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class GeminiVisionService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public record ImageAnalysisResult(
            // Core
            String title,
            String description,
            String category,             // FOOD | MEDICAL | SHELTER | WATER | OTHER
            String urgency,              // LOW | MEDIUM | HIGH | CRITICAL
            int priorityScore,           // 1–100
            String reasoning,
            String suggestedSkills,

            // Location
            String locationHint,         // as visible in the image
            String locationNormalized,   // matched to a known city/state
            double locationConfidence,

            // People
            Integer peopleAffected,
            String crowdDensity,         // NONE | SMALL | MODERATE | LARGE | MASS

            // Language in image
            String textLanguageInImage,  // en | hi | mixed | none
            String extractedTextFromImage,
            String translatedImageText,

            // Confidence
            double categoryConfidence,
            double urgencyConfidence,
            double overallConfidence,
            String confidenceLabel,

            // Explainability
            List<String> alternateCategories,
            List<String> visualCues,

            // Pipeline metadata
            boolean analysisSuccessful,
            boolean usedFallback,
            List<String> warnings
    ) {}

    private static final String[] CATEGORIES = {"FOOD", "MEDICAL", "SHELTER", "WATER", "OTHER"};
    private static final String[] URGENCIES = {"LOW", "MEDIUM", "HIGH", "CRITICAL"};
    private static final String[] CROWD_LEVELS = {"NONE", "SMALL", "MODERATE", "LARGE", "MASS"};

    private static final String VISION_PROMPT = """
            You are an emergency response AI for an NGO disaster coordination system.

            Carefully analyze this image for community needs, distress signals, or emergencies.
            Also carefully READ any text visible in the image (signs, banners, notices, handwritten notes).

            Look for:
            - People in distress or needing help
            - Damaged infrastructure (flooded roads, collapsed buildings)
            - Shortage signs (empty food stalls, dry taps, burned homes)
            - Handwritten or printed distress messages or banners (in ANY language including Hindi)
            - Overcrowded relief camps or queues — estimate crowd size
            - Sick or injured individuals
            - Environmental hazards (fire, flood, drought, contamination)
            - Any numbers, counts, or statistics visible in the image

            Respond ONLY in valid JSON with no markdown or backticks:
            {
              "title": "<short 5-10 word title>",
              "description": "<2-3 sentence description of what is visible>",
              "category": "FOOD|MEDICAL|SHELTER|WATER|OTHER",
              "urgency": "LOW|MEDIUM|HIGH|CRITICAL",
              "priority_score": <integer 1-100>,
              "category_confidence": <float 0.0-1.0>,
              "urgency_confidence": <float 0.0-1.0>,
              "reasoning": "<one sentence explaining urgency assessment>",
              "suggested_skills": "<comma-separated: medical,driving,food_distribution etc>",
              "alternate_categories": "<comma-separated runner-up categories or empty>",
              "visual_cues": "<comma-separated list of what you actually saw>",
              "location_hint": "<any visible text, signs, landmarks or location text visible>",
              "extracted_text": "<ALL text visible in image, in original language>",
              "text_language": "en|hi|mixed|none",
              "translated_text": "<English translation if text was in Hindi, else empty>",
              "people_affected": <integer if visible or estimable, else -1>,
              "crowd_density": "NONE|SMALL|MODERATE|LARGE|MASS",
              "confidence": "HIGH|MEDIUM|LOW"
            }

            If NO emergency or community need is visible, respond with:
            {
              "title": "No emergency detected",
              "description": "The image does not appear to show an emergency situation.",
              "category": "OTHER",
              "urgency": "LOW",
              "priority_score": 5,
              "category_confidence": 0.9,
              "urgency_confidence": 0.9,
              "reasoning": "No visible signs of emergency or distress.",
              "suggested_skills": "",
              "alternate_categories": "",
              "visual_cues": "",
              "location_hint": "",
              "extracted_text": "",
              "text_language": "none",
              "translated_text": "",
              "people_affected": -1,
              "crowd_density": "NONE",
              "confidence": "HIGH"
            }
            """;

    /** Analyses one image and returns the enriched result (never throws). */
    public ImageAnalysisResult analyzeImage(byte[] imageBytes, String mimeType) {
        List<String> warnings = new ArrayList<>();

        try {
            String response = geminiClient.generate(VISION_PROMPT, imageBytes, mimeType, 800, 0.2);
            return parseAndEnrich(response, warnings);
        } catch (Exception e) {
            log.error("Gemini Vision API call failed: {}", e.getMessage());
            warnings.add("Gemini Vision API unavailable — returning fallback result");
            return fallbackResult(warnings);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // PARSE + LOCAL ENRICHMENT
    // ─────────────────────────────────────────────────────────────

    private ImageAnalysisResult parseAndEnrich(String rawResponse, List<String> warnings) {
        try {
            JsonNode json = objectMapper.readTree(AiSupport.stripMarkdown(rawResponse));

            String category = AiSupport.sanitizeEnum(json.path("category").asText("OTHER"), CATEGORIES, "OTHER");
            String urgency = AiSupport.sanitizeEnum(json.path("urgency").asText("MEDIUM"), URGENCIES, "MEDIUM");
            int score = AiSupport.clampInt(json.path("priority_score").asInt(50), 1, 100);

            double categoryConfidence = AiSupport.clamp(json.path("category_confidence").asDouble(0.7), 0, 1);
            double urgencyConfidence = AiSupport.clamp(json.path("urgency_confidence").asDouble(0.7), 0, 1);

            String extractedText = json.path("extracted_text").asText("").trim();
            String textLanguage = json.path("text_language").asText("none").trim();
            String translatedImageText = json.path("translated_text").asText("").trim();

            // Trust the script over the model's own language label
            if ("none".equals(textLanguage) && !extractedText.isEmpty()
                    && AiSupport.DEVANAGARI.matcher(extractedText).find()) {
                textLanguage = "hi";
                warnings.add("Devanagari script detected in image text — overriding language to 'hi'");
            }

            String locationHint = json.path("location_hint").asText("").trim();
            String locationNormalized = AiSupport.normalizeLocation(locationHint);
            double locationConfidence = "unknown".equals(locationNormalized)
                    ? 0.0
                    : locationHint.equals(locationNormalized) ? 0.90 : 0.75;
            if ("unknown".equals(locationNormalized)) {
                warnings.add("Location not identified in image");
            }

            // People count: model value first, then regex over the text seen in the image
            int geminiPeople = json.path("people_affected").asInt(-1);
            Integer people = geminiPeople > 0
                    ? geminiPeople
                    : AiSupport.extractPeopleCount(extractedText + " " + locationHint);
            if (people == null) {
                warnings.add("No people count detected");
            }

            String crowdDensity = AiSupport.sanitizeEnum(
                    json.path("crowd_density").asText("NONE"), CROWD_LEVELS, "NONE");

            String skills = json.path("suggested_skills").asText("").trim();
            if (skills.isBlank()) {
                skills = defaultSkills(category);
            }

            List<String> alternateCategories =
                    AiSupport.parseCsv(json.path("alternate_categories").asText(""));
            List<String> visualCues = AiSupport.parseCsv(json.path("visual_cues").asText(""));
            if (visualCues.isEmpty()) {
                warnings.add("No specific visual cues returned by model");
            }

            double overall = (categoryConfidence + urgencyConfidence + locationConfidence) / 3.0;

            String modelWarning = json.path("warnings").asText("").trim();
            if (!modelWarning.isEmpty()) {
                warnings.add("Model: " + modelWarning);
            }

            return new ImageAnalysisResult(
                    json.path("title").asText("Unspecified community need"),
                    json.path("description").asText("Details extracted from image."),
                    category, urgency, score,
                    json.path("reasoning").asText("Image-based analysis."),
                    skills,
                    locationHint, locationNormalized, AiSupport.round2(locationConfidence),
                    people, crowdDensity,
                    textLanguage, extractedText,
                    translatedImageText.isEmpty() ? null : translatedImageText,
                    AiSupport.round2(categoryConfidence),
                    AiSupport.round2(urgencyConfidence),
                    AiSupport.round2(overall),
                    AiSupport.confidenceLabel(overall),
                    alternateCategories, visualCues,
                    true, false, warnings
            );
        } catch (Exception e) {
            log.error("Failed to parse Gemini Vision response: {}", e.getMessage());
            warnings.add("Response parse failed: " + e.getMessage());
            return fallbackResult(warnings);
        }
    }

    /** Used when Gemini Vision is unavailable: the report survives, a human reviews it. */
    private ImageAnalysisResult fallbackResult(List<String> warnings) {
        return new ImageAnalysisResult(
                "Image report submitted — manual review required",
                "An image was uploaded. AI vision analysis is currently unavailable. Manual review required.",
                "OTHER", "MEDIUM", 50,
                "AI vision analysis unavailable — manual review required.",
                "logistics,coordination",
                "", "unknown", 0.0,
                null, "NONE",
                "none", "", null,
                0.0, 0.0, 0.0, "LOW",
                List.of(), List.of(),
                false, true, warnings
        );
    }

    private String defaultSkills(String category) {
        return switch (category) {
            case "MEDICAL" -> "medical,first_aid,nursing";
            case "FOOD" -> "cooking,food_distribution,logistics";
            case "SHELTER" -> "construction,shelter_management";
            case "WATER" -> "water_supply,sanitation";
            default -> "logistics,driving,coordination";
        };
    }
}
