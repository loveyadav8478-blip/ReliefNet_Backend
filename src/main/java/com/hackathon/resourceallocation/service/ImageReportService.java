package com.hackathon.resourceallocation.service;

import com.hackathon.resourceallocation.dto.ImageReportResponse;
import com.hackathon.resourceallocation.model.Need;
import com.hackathon.resourceallocation.model.NeedImage;
import com.hackathon.resourceallocation.repository.NeedImageRepository;
import com.hackathon.resourceallocation.repository.NeedRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Accepts image reports, stores the files and creates the placeholder need.
 * The AI work itself lives in {@link ImageAnalysisService} and runs asynchronously.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ImageReportService {

    private static final int MAX_IMAGES = 5;

    private final ImageStorageService storageService;
    private final ImageAnalysisService imageAnalysisService;
    private final NeedRepository needRepository;
    private final NeedImageRepository needImageRepository;

    /**
     * Stores the uploads and creates a placeholder need, then triggers analysis.
     * Not @Transactional on purpose: rows are committed before the async worker
     * reads them, and one failed file does not roll back the successful ones.
     */
    public ImageReportResponse submitImageReport(List<MultipartFile> images,
                                                 String reporterName,
                                                 String reporterContact,
                                                 String locationName,
                                                 Double latitude,
                                                 Double longitude) throws IOException {
        validate(images);

        Need need = needRepository.save(Need.builder()
                .title("Image report — AI analysis pending...")
                .description("This need was reported via image. AI is analyzing the content.")
                .status(Need.NeedStatus.OPEN)
                .source("IMAGE")
                .reporterName(reporterName)
                .reporterContact(reporterContact)
                .locationName(locationName)
                .latitude(latitude)
                .longitude(longitude)
                .build());
        log.info("Created image-based need placeholder ID: {}", need.getId());

        List<NeedImage> savedImages = storeImages(need, images);
        if (savedImages.isEmpty()) {
            throw new IOException("All image uploads failed. Please try again.");
        }

        imageAnalysisService.analyzeAsync(need.getId(),
                savedImages.stream().map(NeedImage::getId).toList());

        return ImageReportResponse.builder()
                .needId(need.getId())
                .message("Report submitted. AI is analyzing your images.")
                .imageCount(savedImages.size())
                .imageUrls(savedImages.stream().map(NeedImage::getPublicUrl).toList())
                .status("PENDING_AI_ANALYSIS")
                .analysisSuccessful(false)
                .usedFallback(false)
                .imagesSuccessfullyAnalyzed(0)
                .imagesFailed(0)
                .build();
    }

    /** Re-runs vision analysis for an existing image report. */
    public ImageReportResponse reanalyzeImages(Long needId) {
        needRepository.findById(needId)
                .orElseThrow(() -> new IllegalArgumentException("Need not found: " + needId));

        List<NeedImage> images = needImageRepository.findByNeedId(needId);
        if (images.isEmpty()) {
            throw new IllegalArgumentException("No images found for need: " + needId);
        }

        images.forEach(image -> {
            image.setAiProcessed(false);
            needImageRepository.save(image);
        });

        imageAnalysisService.analyzeAsync(needId,
                images.stream().map(NeedImage::getId).toList());

        return ImageReportResponse.builder()
                .needId(needId)
                .message("Re-analysis triggered for " + images.size() + " image(s).")
                .imageCount(images.size())
                .imageUrls(images.stream().map(NeedImage::getPublicUrl).toList())
                .status("REANALYSIS_TRIGGERED")
                .build();
    }

    public List<NeedImage> getImagesForNeed(Long needId) {
        return needImageRepository.findByNeedId(needId);
    }

    // ─────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────

    private void validate(List<MultipartFile> images) {
        if (images == null || images.isEmpty()) {
            throw new IllegalArgumentException("At least one image is required.");
        }
        if (images.size() > MAX_IMAGES) {
            throw new IllegalArgumentException("Maximum " + MAX_IMAGES + " images per report.");
        }
    }

    /** Stores each file; a failed file is logged and skipped rather than failing the report. */
    private List<NeedImage> storeImages(Need need, List<MultipartFile> images) {
        List<NeedImage> saved = new ArrayList<>();

        for (MultipartFile file : images) {
            try {
                ImageStorageService.StoredFile stored = storageService.store(file);
                saved.add(needImageRepository.save(NeedImage.builder()
                        .need(need)
                        .originalFilename(stored.originalFilename())
                        .storedFilename(stored.storedFilename())
                        .filePath(stored.relativePath())
                        .publicUrl(stored.publicUrl())
                        .contentType(stored.contentType())
                        .fileSizeBytes(stored.sizeBytes())
                        .aiProcessed(false)
                        .build()));
                log.info("Saved image {} for need {}", stored.relativePath(), need.getId());
            } catch (Exception e) {
                log.error("Failed to store image for need {}: {}", need.getId(), e.getMessage());
            }
        }
        return saved;
    }
}
