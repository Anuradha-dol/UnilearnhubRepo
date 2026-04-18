package com.itpm.website.utils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class UploadMediaResolver {

    private static final String UPLOADS_PREFIX = "/uploads/";

    private final List<Path> uploadRoots;
    private final ConcurrentHashMap<String, Boolean> existenceCache = new ConcurrentHashMap<>();

    public UploadMediaResolver(@Value("${file.upload-dir:uploads}") String uploadDir) {
        Path cwd = Paths.get("").toAbsolutePath().normalize();
        Path parent = cwd.getParent();

        Set<Path> roots = new LinkedHashSet<>();
        roots.add(Paths.get(uploadDir).toAbsolutePath().normalize());
        roots.add(cwd.resolve("uploads").toAbsolutePath().normalize());
        if (parent != null) {
            roots.add(parent.resolve("uploads").toAbsolutePath().normalize());
        }
        roots.add(cwd.resolve("website backend").resolve("website").resolve("uploads").toAbsolutePath().normalize());

        this.uploadRoots = new ArrayList<>(roots);
    }

    public String safeUploadUrl(String url) {
        if (url == null || url.isBlank()) {
            return null;
        }

        if (!url.startsWith(UPLOADS_PREFIX)) {
            return url;
        }

        String relative = url.substring(UPLOADS_PREFIX.length());
        if (relative.isBlank()) {
            return null;
        }

        boolean exists = existenceCache.computeIfAbsent(url, key -> fileExists(relative));
        return exists ? url : null;
    }

    private boolean fileExists(String relativePath) {
        for (Path root : uploadRoots) {
            Path candidate = root.resolve(relativePath).normalize();
            if (candidate.startsWith(root) && Files.exists(candidate)) {
                return true;
            }
        }
        return false;
    }
}
