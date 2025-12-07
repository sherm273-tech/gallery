package au.com.siac.gallery.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Controller
public class MusicController {

    @Value("${music.folder}")
    private String musicFolder;

    @GetMapping("/api/music/list")
    @ResponseBody
    public List<String> getMusicList() throws IOException {
        Path folderPath = Paths.get(musicFolder);

        if (!Files.exists(folderPath) || !Files.isDirectory(folderPath)) {
            return new ArrayList<>();
        }

        try (Stream<Path> paths = Files.walk(folderPath)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(f -> f.getFileName().toString().toLowerCase().endsWith(".mp3"))
                    .map(folderPath::relativize)
                    .map(Path::toString)
                    .map(p -> p.replace("\\", "/"))
                    .sorted()
                    .collect(Collectors.toList());
        }
    }

    @GetMapping("/music/**")
    public ResponseEntity<Resource> getMusic(
            HttpServletRequest request,
            @RequestHeader(value = "Range", required = false) String rangeHeader) throws IOException {
        
        String pathWithinHandler = (String) request.getAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatchPattern = (String) request.getAttribute(
                HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);

        String relativePath = new AntPathMatcher()
                .extractPathWithinPattern(bestMatchPattern, pathWithinHandler);

        // Decode URL-encoded path (e.g., %20 becomes space)
        relativePath = URLDecoder.decode(relativePath, StandardCharsets.UTF_8);

        // Use Paths.get with the relative path directly
        Path filePath = Paths.get(musicFolder).resolve(relativePath);

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new RuntimeException("Music file not found: " + filePath.toAbsolutePath());
        }

        Resource resource = new UrlResource(filePath.toUri());
        long fileSize = Files.size(filePath);

        // Handle range requests for streaming (required for many Smart TVs/monitors)
        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            String[] ranges = rangeHeader.substring(6).split("-");
            long start = Long.parseLong(ranges[0]);
            long end = ranges.length > 1 && !ranges[1].isEmpty() 
                    ? Long.parseLong(ranges[1]) 
                    : fileSize - 1;

            long contentLength = end - start + 1;

            InputStream inputStream = Files.newInputStream(filePath);
            inputStream.skip(start);

            return ResponseEntity.status(206) // 206 Partial Content
                    .header("Content-Type", "audio/mpeg")
                    .header("Accept-Ranges", "bytes")
                    .header("Content-Range", "bytes " + start + "-" + end + "/" + fileSize)
                    .header("Content-Length", String.valueOf(contentLength))
                    .body(new InputStreamResource(inputStream));
        }

        // Normal response (full file)
        return ResponseEntity.ok()
                .header("Content-Type", "audio/mpeg")
                .header("Accept-Ranges", "bytes")
                .header("Content-Length", String.valueOf(fileSize))
                .body(resource);
    }
}