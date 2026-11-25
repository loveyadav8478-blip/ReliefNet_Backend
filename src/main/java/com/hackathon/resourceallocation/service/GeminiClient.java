package com.hackathon.resourceallocation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * The only place that talks to the Gemini REST API: builds the absolute endpoint,
 * posts the request and unwraps the text from the response envelope.
 * Callers get plain text back and stay focused on prompt + parsing logic.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String apiUrl;

    /** Model id from config — 1.5-flash and 2.5-flash are retired/deprecated upstream. */
    @Value("${gemini.api.model:gemini-3.5-flash-lite}")
    private String model;

    /** True when a URL, an API key and a model are actually configured. */
    public boolean isConfigured() {
        return hasValue(apiUrl) && hasValue(apiKey) && hasValue(model);
    }

    /** Text-only prompt. Returns the model's raw text answer. */
    public String generate(String prompt, int maxTokens, double temperature) {
        return post(Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of("temperature", temperature, "maxOutputTokens", maxTokens)
        ));
    }

    /** Prompt plus an image (sent inline). Returns the model's raw text answer. */
    public String generate(String prompt, byte[] imageBytes, String mimeType,
                           int maxTokens, double temperature) {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        return post(Map.of(
                "contents", List.of(Map.of("role", "user", "parts", List.of(
                        Map.of("text", prompt),
                        Map.of("inline_data", Map.of("mime_type", mimeType, "data", base64Image))
                ))),
                "generationConfig", Map.of("temperature", temperature, "maxOutputTokens", maxTokens)
        ));
    }

    private String post(Map<String, Object> body) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Gemini API is not configured (set GEMINI_API_KEY / GEMINI_API_URL / GEMINI_MODEL)");
        }

        String response = webClient.post()
                .uri(endpoint())
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return extractText(response);
    }

    private URI endpoint() {
        return UriComponentsBuilder.fromHttpUrl(apiUrl.trim())
                .path("/v1beta/models/" + model.trim() + ":generateContent")
                .queryParam("key", apiKey.trim())
                .build()
                .toUri();
    }

    private String extractText(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) {
            throw new IllegalStateException("Empty response from Gemini");
        }
        try {
            JsonNode text = objectMapper.readTree(rawResponse)
                    .path("candidates").path(0)
                    .path("content").path("parts").path(0)
                    .path("text");
            if (text.isMissingNode() || text.asText().isBlank()) {
                throw new IllegalStateException("Gemini response contained no text");
            }
            return text.asText();
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Could not read Gemini response: " + e.getMessage(), e);
        }
    }

    private static boolean hasValue(String value) {
        return value != null && !value.isBlank() && !"null".equalsIgnoreCase(value.trim());
    }
}
