package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.NeedImage;
import com.hackathon.resourceallocation.repository.NeedImageRepository;
import com.hackathon.resourceallocation.repository.NeedRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Runs Gemini Vision over uploaded images and writes the strongest result onto the need.
 *
 * Separate bean from ImageReportService so @Async / @Transactional actually apply
 * (they are bypassed when a bean calls its own proxied method).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ImageAnalysisService {

    private final ImageStorageService storageService;
    private final GeminiVisionService visionService;
    private final NeedRepository needRepository;
    private final NeedImageRepository needImageRepository;

    /** Fire-and-forget analysis of the given images; safe to call right after upload. */
    @Async
    @Transactional
    public void analyzeAsync(Long needId, List<Long> imageIds) {
        needRepository.findById(needId).ifPresentOrElse(
                need -> analyze(need, imageIds),
                () -> log.warn("Skipping vision analysis — need {} no longer exists", needId));
    }

    private void analyze(Need need, List<Long> imageIds) {
        log.info("Vision analysis starting for need ID: {}", need.getId());

        GeminiVisionService.ImageAnalysisResult bestResult = null;
        int bestScore = 0;
        int failures = 0;

        for (NeedImage image : needImageRepository.findAllById(imageIds)) {
            try {
                byte[] bytes = storageService.readBytes(image.getFilePath());
                GeminiVisionService.ImageAnalysisResult result =
                        visionService.analyzeImage(bytes, image.getContentType());

                image.setAiExtractedText(buildImageSummary(result));
                image.setAiProcessed(true);
                needImageRepository.save(image);

                // Keep the highest-priority result across all images
                if (result.priorityScore() > bestScore) {
                    bestScore = result.priorityScore();
                    bestResult = result;
                }

                log.info("Image {} analyzed: {} / {} / score:{} / conf:{} / people:{}",
                        image.getStoredFilename(), result.category(), result.urgency(),
                        result.priorityScore(), result.overallConfidence(), result.peopleAffected());
            } catch (Exception e) {
                failures++;
                log.error("Vision analysis failed for image {}: {}",
                        image.getStoredFilename(), e.getMessage());
            }
        }

        if (bestResult != null) {
            applyVisionResult(need, bestResult);
            log.info("Need {} updated from vision analysis: {} / {} / score:{}",
                    need.getId(), bestResult.category(), bestResult.urgency(), bestResult.priorityScore());
        } else {
            markForManualReview(need, failures);
            log.warn("No usable vision result for need {} — flagged for manual review", need.getId());
        }

        needRepository.save(need);
    }

    /** All AI calls failed: keep the need visible but clearly flagged for a human. */
    private void markForManualReview(Need need, int failures) {
        need.setTitle("Image report — manual review required");
        need.setDescription("Images uploaded but AI analysis failed. Coordinator review needed.");
        need.setUrgency(Need.UrgencyLevel.MEDIUM);
        need.setPriorityScore(50);
        need.setAiReasoning("AI vision analysis unavailable. Manual review required.");
        need.setAiUsedFallback(true);
        need.setAiWarnings(new ArrayList<>(List.of("All " + failures + " image analyses failed")));
    }

    /** Single mapper from the vision result onto the entity. */
    private void applyVisionResult(Need need, GeminiVisionService.ImageAnalysisResult result) {
        need.setTitle(result.title());
        need.setDescription(result.description());

        need.setCategory(parseCategory(result.category()));
        need.setUrgency(parseUrgency(result.urgency()));

        need.setPriorityScore(result.priorityScore());
        need.setSuggestedSkills(result.suggestedSkills());

        String reasoning = result.reasoning();
        if (hasText(result.locationHint())) {
            reasoning += " | Location visible in image: " + result.locationHint();
        }
        need.setAiReasoning(reasoning);

        need.setCategoryConfidence(result.categoryConfidence());
        need.setUrgencyConfidence(result.urgencyConfidence());
        need.setOverallConfidence(result.overallConfidence());
        need.setConfidenceLabel(result.confidenceLabel());

        // The normalised city name wins over the raw hint from the image
        String location = hasText(result.locationNormalized())
                && !"unknown".equals(result.locationNormalized())
                ? result.locationNormalized()
                : result.locationHint();
        if (hasText(location)) {
            need.setAiDetectedLocation(location);
            need.setLocationConfidence(result.locationConfidence());
            if (!hasText(need.getLocationName())) {
                need.setLocationName(location);
            }
        }

        if (result.peopleAffected() != null) {
            need.setPeopleAffected(result.peopleAffected());
        }
        need.setCrowdDensity(result.crowdDensity());

        need.setTextLanguageInImage(result.textLanguageInImage());
        need.setExtractedTextFromImage(result.extractedTextFromImage());
        need.setTranslatedImageText(result.translatedImageText());

        // JPA element collections must be mutable: Hibernate clears and refills them on merge,
        // and List.of(...) / Stream.toList() throw UnsupportedOperationException there.
        need.setAlternateCategories(mutable(result.alternateCategories()));
        need.setVisualCues(mutable(result.visualCues()));

        need.setAiUsedFallback(result.usedFallback());
        need.setAiWarnings(mutable(result.warnings()));
    }

    /** Per-image summary stored on the NeedImage row. */
    private String buildImageSummary(GeminiVisionService.ImageAnalysisResult result) {
        StringBuilder summary = new StringBuilder()
                .append("[").append(result.category()).append("/").append(result.urgency())
                .append("/score:").append(result.priorityScore())
                .append("/conf:").append(result.overallConfidence()).append("] ")
                .append(result.description());

        if (result.peopleAffected() != null) {
            summary.append(" | People: ").append(result.peopleAffected());
        }
        if (hasText(result.crowdDensity()) && !"NONE".equals(result.crowdDensity())) {
            summary.append(" | Crowd: ").append(result.crowdDensity());
        }
        if (hasText(result.locationNormalized()) && !"unknown".equals(result.locationNormalized())) {
            summary.append(" | Location: ").append(result.locationNormalized());
        }
        if (hasText(result.extractedTextFromImage())) {
            summary.append(" | Text in image: ").append(result.extractedTextFromImage());
        }
        return summary.toString();
    }

    private Need.Category parseCategory(String raw) {
        try {
            return Need.Category.valueOf(raw);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown category '{}' — defaulting to OTHER", raw);
            return Need.Category.OTHER;
        }
    }

    private Need.UrgencyLevel parseUrgency(String raw) {
        try {
            return Need.UrgencyLevel.valueOf(raw);
        } catch (IllegalArgumentException e) {
            log.warn("Unknown urgency '{}' — defaulting to MEDIUM", raw);
            return Need.UrgencyLevel.MEDIUM;
        }
    }

    private static List<String> mutable(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
