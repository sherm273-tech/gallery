package au.com.siac.gallery.video.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * NEW VideoStreamingController - Clean implementation
 * Serves video files with HTTP Range request support for seeking
 */
@RestController
@RequestMapping("/api/videos")
public class VideoStreamingController {
    
    @Value("${image.folder}")
    private String imageFolder;
    
    /**
     * Test endpoint to verify controller is working
     */
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("VideoStreamingController is working! Image folder: " + imageFolder);
    }
    
    /**
     * Stream video files - uses Spring's native ResourceRegion for optimal performance
     * This is the CORRECT way to do video streaming in Spring Boot
     */
    @GetMapping("/**")
    public ResponseEntity<org.springframework.core.io.support.ResourceRegion> streamVideo(
            @RequestHeader(value = "Range", required = false) String rangeHeader,
            jakarta.servlet.http.HttpServletRequest request) throws IOException {
        
        // Extract the path after /api/videos/
        String requestUrl = request.getRequestURI();
        String relativePath = requestUrl.substring("/api/videos/".length());
        
        System.out.println("[VideoStreamingController] Requested path: " + relativePath);
        
        // Resolve full file path
        Path filePath = Paths.get(imageFolder).resolve(relativePath);
        
        System.out.println("[VideoStreamingController] Full path: " + filePath);
        
        // Check file exists
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            System.err.println("[VideoStreamingController] File not found: " + filePath);
            return ResponseEntity.notFound().build();
        }
        
        long fileSize = Files.size(filePath);
        Resource video = new FileSystemResource(filePath);
        String contentType = getContentType(filePath.getFileName().toString());
        
        System.out.println("[VideoStreamingController] File size: " + fileSize + ", Content-Type: " + contentType);
        
        // Parse range or use default
        long start = 0;
        long end = fileSize - 1;
        
        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            String[] ranges = rangeHeader.substring(6).split("-");
            start = Long.parseLong(ranges[0]);
            
            if (ranges.length > 1 && !ranges[1].isEmpty()) {
                end = Long.parseLong(ranges[1]);
            }
            
            System.out.println("[VideoStreamingController] Range request: bytes " + start + "-" + end + "/" + fileSize);
        } else {
            System.out.println("[VideoStreamingController] No range header, serving full file");
        }
        
        long rangeLength = end - start + 1;
        
        // Use Spring's ResourceRegion - it handles everything optimally!
        org.springframework.core.io.support.ResourceRegion region = 
            new org.springframework.core.io.support.ResourceRegion(video, start, rangeLength);
        
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                .header(HttpHeaders.CONTENT_TYPE, contentType)
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                .header(HttpHeaders.ETAG, "\"" + filePath.getFileName() + "-" + fileSize + "\"")
                .body(region);
    }
    
    /**
     * Handle range request by actually reading and sending only requested bytes
     * ULTIMATE OPTIMIZATION - Optimized for continuous smooth playback
     */
    
    
    /**
     * Get content type based on file extension
     */
    private String getContentType(String fileName) {
        String lower = fileName.toLowerCase();
        
        if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) {
            return "video/mp4";
        } else if (lower.endsWith(".mov")) {
            return "video/quicktime";
        } else if (lower.endsWith(".avi")) {
            return "video/x-msvideo";
        } else if (lower.endsWith(".mkv")) {
            return "video/x-matroska";
        } else if (lower.endsWith(".webm")) {
            return "video/webm";
        } else if (lower.endsWith(".wmv")) {
            return "video/x-ms-wmv";
        }
        
        return "video/mp4"; // Default
    }
}
