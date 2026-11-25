package com.hackathon.resourceallocation.service;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Lookup tables and small helpers shared by the AI services, so the same
 * city list, people-count regexes and clamp/format rules exist in one place.
 */
public final class AiSupport {

    private AiSupport() {}

    /** Cities and states used to normalise a free-text location into a known place. */
    public static final List<String> INDIA_CITIES = List.of(
            "Mumbai", "Delhi", "New Delhi", "Bangalore", "Bengaluru", "Kolkata", "Chennai", "Hyderabad",
            "Ahmedabad", "Pune", "Surat", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Bhopal",
            "Visakhapatnam", "Patna", "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad",
            "Meerut", "Rajkot", "Varanasi", "Aurangabad", "Ranchi", "Amritsar", "Allahabad", "Prayagraj",
            "Coimbatore", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Mysuru",
            "Gurgaon", "Gurugram", "Noida", "Bareilly", "Moradabad", "Jalandhar", "Bhubaneswar",
            "Dehradun", "Kochi", "Udaipur", "Ajmer", "Jammu", "Mangaluru", "Ayodhya", "Lakhimpur",
            "Sitapur", "Muzaffarpur", "Gorakhpur", "Azamgarh", "Jhansi", "Mathura", "Aligarh",
            "Modinagar", "Hapur", "Bulandshahr", "Saharanpur", "Muzaffarnagar",
            "Uttarakhand", "Bihar", "Uttar Pradesh", "Maharashtra", "Rajasthan", "Gujarat", "Punjab",
            "Haryana", "Odisha", "Kerala", "Jharkhand", "Assam", "Himachal Pradesh", "Chhattisgarh",
            "West Bengal", "Tamil Nadu", "Karnataka", "Telangana", "Andhra Pradesh", "Madhya Pradesh"
    );

    public static final Pattern DEVANAGARI = Pattern.compile("[\\u0900-\\u097F]+");

    /** Patterns that pull "number of people affected" out of free text, most specific first. */
    public static final List<Pattern> PEOPLE_PATTERNS = List.of(
            Pattern.compile("(\\d[\\d,]*)\\s*(?:people|persons?|individuals?|families|households?|victims?|affected)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:affecting|impacted?|displaced?|suffering|serving)\\s+(\\d[\\d,]*)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:around|nearly|approximately|about|over|more than)\\s+(\\d[\\d,]*)",
                    Pattern.CASE_INSENSITIVE),
            Pattern.compile("(\\d[\\d,]{2,})")
    );

    /** Largest people-count mentioned in the text, or null when none is found. */
    public static Integer extractPeopleCount(String text) {
        if (text == null || text.isBlank()) return null;
        String lower = text.toLowerCase();

        for (Pattern pattern : PEOPLE_PATTERNS) {
            Matcher matcher = pattern.matcher(lower);
            int best = -1;
            while (matcher.find()) {
                try {
                    int value = Integer.parseInt(matcher.group(1).replace(",", ""));
                    if (value >= 1 && value <= 10_000_000) best = Math.max(best, value);
                } catch (NumberFormatException ignored) {
                    // not a usable number — keep looking
                }
            }
            if (best > 0) return best;
        }
        return null;
    }

    /** Matches a raw location string against the known city list; "unknown" when nothing fits. */
    public static String normalizeLocation(String raw) {
        if (raw == null || raw.isBlank()) return "unknown";
        String lower = raw.toLowerCase();

        for (String city : INDIA_CITIES) {
            if (lower.contains(city.toLowerCase())) return city;
        }

        Matcher matcher = Pattern.compile(
                "\\b(?:in|at|near|from|of)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+){0,2})"
        ).matcher(raw);
        while (matcher.find()) {
            String candidate = matcher.group(1);
            for (String city : INDIA_CITIES) {
                if (city.equalsIgnoreCase(candidate)) return city;
            }
        }

        // Keep a plausible proper noun even if it is not in the list
        return raw.matches("[A-Z][a-zA-Z ]+") ? raw.trim() : "unknown";
    }

    /** Returns the allowed value matching case-insensitively, otherwise the fallback. */
    public static String sanitizeEnum(String value, String[] allowed, String fallback) {
        for (String candidate : allowed) {
            if (candidate.equalsIgnoreCase(value)) return candidate;
        }
        return fallback;
    }

    /** Strips ```json fences / stray backticks some models add around JSON. */
    public static String stripMarkdown(String text) {
        return text.replaceAll("(?s)```json\\s*", "").replaceAll("```", "").trim();
    }

    public static int clampInt(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    public static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    public static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    public static String confidenceLabel(double confidence) {
        if (confidence >= 0.75) return "HIGH";
        if (confidence >= 0.50) return "MEDIUM";
        return "LOW";
    }

    /** Splits a comma-separated string into trimmed, non-empty values. */
    public static List<String> parseCsv(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(value -> !value.isEmpty())
                .toList();
    }
}
