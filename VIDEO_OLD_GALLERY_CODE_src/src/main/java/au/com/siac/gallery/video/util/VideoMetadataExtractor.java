package au.com.siac.gallery.video.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
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
 * Phase 1 implementation: Basic file metadata
 * TODO: Future enhancement - use FFmpeg or similar for detailed video metadata
 */
@Component
public class VideoMetadataExtractor {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoMetadataExtractor.class);
    
    /**
     * Extract metadata from video file
     * Phase 1: Returns basic file information
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
            
            // Phase 1: Placeholder values for video-specific metadata
            // These will be replaced with actual extraction in future phases
            metadata.put("duration", estimateDurationFromFileSize(attrs.size()));
            metadata.put("resolution", "Unknown");
            
            logger.debug("Extracted metadata for video: {}", videoPath.getFileName());
            
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
