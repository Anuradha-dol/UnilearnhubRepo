package com.itpm.website.utils;

import org.springframework.stereotype.Component;

@Component
public class UploadMediaResolver {

    public String safeUploadUrl(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) {
            return null;
        }

        String normalized = imageUrl.trim().replace("\\", "/");

        if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
            return normalized;
        }

        if (normalized.startsWith("/uploads/")) {
            return normalized;
        }

        if (normalized.startsWith("uploads/")) {
            return "/" + normalized;
        }

        return "/uploads/" + normalized;
    }
}
