package au.com.siac.gallery.video.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for extracting metadata from video files
 * Uses FFmpeg/ffprobe for accurate video duration and resolution
 */
@Component
public class VideoMetadataExtractor {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoMetadataExtractor.class);
    
    /**
     * Extract metadata from video file
     * Uses FFmpeg to get accurate duration and resolution
     * 
     * @param videoPath Path to video file
     * @return Map containing metadata (duration, resolution, captureDate, etc.)
     */
    public Map<String, Object> extractMetadata(Path videoPath) {
        Map<String, Object> metadata = new HashMap<>();
        
        try {
            // Get file attributes
            BasicFileAttributes attrs = Files.readAttributes(videoPath, BasicFileAttributes.class);
            
            // Extract capture date from file creation time
            Instant creationTime = attrs.creationTime().toInstant();
            LocalDate captureDate = creationTime.atZone(ZoneId.systemDefault()).toLocalDate();
            metadata.put("captureDate", captureDate);
            metadata.put("dateSource", "FILE_CREATION");
            
            // File size
            metadata.put("fileSize", attrs.size());
            
            // Extract real duration and resolution using FFmpeg
            Map<String, Object> videoInfo = extractVideoInfoWithFFmpeg(videoPath);
            metadata.put("duration", videoInfo.get("duration"));
            metadata.put("resolution", videoInfo.get("resolution"));
            
            logger.debug("Extracted metadata for video: {} ({}s, {})", 
                videoPath.getFileName(), 
                videoInfo.get("duration"),
                videoInfo.get("resolution"));
            
        } catch (IOException e) {
            logger.error("Failed to extract metadata from: " + videoPath, e);
            
            // Return minimal metadata
            metadata.put("captureDate", LocalDate.now());
            metadata.put("dateSource", "FILE_CREATION");
            metadata.put("duration", null);
            metadata.put("resolution", "Unknown");
        }
        
        return metadata;
    }
    
    /**
     * Extract video duration and resolution using FFmpeg
     * Uses ffprobe (part of FFmpeg) to get accurate metadata
     */
    private Map<String, Object> extractVideoInfoWithFFmpeg(Path videoPath) {
        Map<String, Object> info = new HashMap<>();
        info.put("duration", null);
        info.put("resolution", "Unknown");
        
        try {
            // Use ffprobe to get video metadata in JSON format
            ProcessBuilder pb = new ProcessBuilder(
                "ffprobe",
                "-v", "quiet",
                "-print_format", "json",
                "-show_format",
                "-show_streams",
                videoPath.toString()
            );
            
            pb.redirectErrorStream(true);
            Process process = pb.start();
            
            // Read the JSON output
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line);
                }
            }
            
            int exitCode = process.waitFor();
            
            if (exitCode == 0 && output.length() > 0) {
                // Parse duration from format section
                String jsonOutput = output.toString();
                
                // Extract duration (in seconds)
                java.util.regex.Pattern durationPattern = java.util.regex.Pattern.compile("\"duration\"\\s*:\\s*\"([0-9.]+)\"");
                java.util.regex.Matcher durationMatcher = durationPattern.matcher(jsonOutput);
                if (durationMatcher.find()) {
                    double durationSeconds = Double.parseDouble(durationMatcher.group(1));
                    info.put("duration", (int) Math.round(durationSeconds));
                }
                
                // Extract resolution (width x height)
                java.util.regex.Pattern widthPattern = java.util.regex.Pattern.compile("\"width\"\\s*:\\s*([0-9]+)");
                java.util.regex.Pattern heightPattern = java.util.regex.Pattern.compile("\"height\"\\s*:\\s*([0-9]+)");
                java.util.regex.Matcher widthMatcher = widthPattern.matcher(jsonOutput);
                java.util.regex.Matcher heightMatcher = heightPattern.matcher(jsonOutput);
                
                if (widthMatcher.find() && heightMatcher.find()) {
                    String width = widthMatcher.group(1);
                    String height = heightMatcher.group(1);
                    info.put("resolution", width + "x" + height);
                }
            } else {
                logger.warn("FFprobe failed for: {}, using fallback", videoPath.getFileName());
                // Fallback to file size estimate
                BasicFileAttributes attrs = Files.readAttributes(videoPath, BasicFileAttributes.class);
                info.put("duration", estimateDurationFromFileSize(attrs.size()));
            }
            
        } catch (Exception e) {
            logger.warn("Could not extract video info with FFmpeg: {}", e.getMessage());
            // Return defaults (will use file size estimate as fallback)
        }
        
        return info;
    }
    
    /**
     * Rough estimate of video duration based on file size
     * Assumes average bitrate of 5 Mbps for HD video
     * This is a placeholder - real duration will be extracted with FFmpeg later
     */
    private Integer estimateDurationFromFileSize(long fileSizeBytes) {
        // Average bitrate: 5 Mbps = 625 KB/s
        // Duration = fileSize / bytesPerSecond
        long bytesPerSecond = 625 * 1024; // 625 KB/s
        return (int) (fileSizeBytes / bytesPerSecond);
    }
    
    /**
     * Check if file is a supported video format
     */
    public boolean isVideoFile(String filename) {
        if (filename == null) {
            return false;
        }
        
        String lowerFilename = filename.toLowerCase();
        return lowerFilename.endsWith(".mp4") ||
               lowerFilename.endsWith(".mov") ||
               lowerFilename.endsWith(".avi") ||
               lowerFilename.endsWith(".mkv") ||
               lowerFilename.endsWith(".webm") ||
               lowerFilename.endsWith(".m4v") ||
               lowerFilename.endsWith(".wmv");
    }
}
