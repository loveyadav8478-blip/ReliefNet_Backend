package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.NeedResponse;
import com.hackathon.resourceallocation.exception.ResourceNotFoundException;
import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.repository.NeedRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Runs the AI analysis for a text-reported need and writes the result back.
 *
 * Lives in its own bean on purpose: Spring's @Async and @Transactional only work
 * when the call goes through a proxy, so calling these methods from another bean
 * (never from inside this one) is what makes them actually asynchronous.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class NeedAnalysisService {

    private final NeedRepository needRepository;
    private final AIService aiService;

    /** Fire-and-forget analysis, used right after a need is created. */
    @Async
    @Transactional
    public void analyzeAsync(Long needId) {
        try {
            analyze(needId);
        } catch (Exception e) {
            // Async analysis must never crash the request that triggered it
            log.error("AI analysis failed for need {}", needId, e);
        }
    }

    /** Synchronous analysis, used by the manual "analyze this need" endpoint. */
    @Transactional
    public NeedResponse analyzeNow(Long needId) {
        return NeedResponse.from(needRepository.save(analyze(needId)));
    }

    private Need analyze(Long needId) {
        Need need = needRepository.findById(needId)
                .orElseThrow(() -> new ResourceNotFoundException("Need not found with ID: " + needId));

        AIService.AIAnalysisResult result = aiService.analyzeNeed(need.getTitle(), need.getDescription());
        if (result == null) {
            log.warn("AI returned no result for need {} — leaving it unanalysed", needId);
            return need;
        }

        applyResult(need, result);
        log.info("AI analysis saved for need {}: category={} urgency={} score={}",
                needId, result.category(), result.urgency(), result.priorityScore());
        return need;
    }

    /** Single mapper from the AI result onto the entity. */
    private void applyResult(Need need, AIService.AIAnalysisResult result) {
        need.setCategory(Need.Category.valueOf(result.category()));
        need.setUrgency(Need.UrgencyLevel.valueOf(result.urgency()));
        need.setPriorityScore(result.priorityScore());
        need.setAiReasoning(result.reasoning());
        need.setSuggestedSkills(result.suggestedSkills());

        need.setCategoryConfidence(result.categoryConfidence());
        need.setUrgencyConfidence(result.urgencyConfidence());
        need.setOverallConfidence(result.overallConfidence());
        need.setConfidenceLabel(result.confidenceLabel());

        need.setPeopleAffected(result.peopleAffected());
        // JPA element collections must be mutable: Hibernate clears and refills them on merge,
        // and List.of(...) / Stream.toList() throw UnsupportedOperationException there.
        need.setMatchedKeywords(mutable(result.matchedKeywords()));
        need.setAlternateCategories(mutable(result.alternateCategories()));

        need.setDetectedLanguage(result.detectedLanguage());
        need.setTranslatedText(result.translatedText());

        need.setAiDetectedLocation(result.aiDetectedLocation());
        need.setLocationConfidence(result.locationConfidence());

        need.setAiUsedFallback(result.aiUsedFallback());
        need.setAiWarnings(mutable(result.aiWarnings()));
    }

    private static List<String> mutable(List<String> values) {
        return values == null ? new ArrayList<>() : new ArrayList<>(values);
    }
}
