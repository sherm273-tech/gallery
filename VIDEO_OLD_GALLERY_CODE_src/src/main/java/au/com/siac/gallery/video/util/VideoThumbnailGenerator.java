package au.com.siac.gallery.video.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Utility class for generating video thumbnails
 * Uses simple frame extraction approach for Phase 1
 */
@Component
public class VideoThumbnailGenerator {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoThumbnailGenerator.class);
    
    private static final int THUMBNAIL_SIZE = 400;
    
    /**
     * Generate a thumbnail for a video file
     * For Phase 1: Creates a placeholder thumbnail with video icon
     * TODO: Future enhancement - extract actual frame from video using FFmpeg
     * 
     * @param videoPath Path to the video file
     * @param thumbnailPath Path where thumbnail should be saved
     * @return true if thumbnail was generated successfully
     */
    public boolean generateVideoThumbnail(Path videoPath, Path thumbnailPath) {
        try {
            // Create parent directories if needed
            Path thumbnailParent = thumbnailPath.getParent();
            if (thumbnailParent != null && !Files.exists(thumbnailParent)) {
                Files.createDirectories(thumbnailParent);
            }
            
            // For Phase 1: Generate a placeholder thumbnail
            // This will be replaced with actual frame extraction in future
            BufferedImage thumbnail = createVideoPlaceholderThumbnail(videoPath);
            
            // Save as JPEG
            File outputFile = thumbnailPath.toFile();
            ImageIO.write(thumbnail, "jpg", outputFile);
            
            logger.debug("Generated placeholder thumbnail for video: {} -> {}", 
                videoPath.getFileName(), thumbnailPath.getFileName());
            
            return true;
            
        } catch (IOException e) {
            logger.error("Failed to generate video thumbnail for: " + videoPath, e);
            return false;
        }
    }
    
    /**
     * Create a placeholder thumbnail with video icon
     * Phase 1 implementation - simple colored background with 🎬 icon
     */
    private BufferedImage createVideoPlaceholderThumbnail(Path videoPath) {
        BufferedImage thumbnail = new BufferedImage(
            THUMBNAIL_SIZE, 
            THUMBNAIL_SIZE, 
            BufferedImage.TYPE_INT_RGB
        );
        
        Graphics2D g2d = thumbnail.createGraphics();
        
        // Enable anti-aliasing for better quality
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        
        // Dark gradient background
        GradientPaint gradient = new GradientPaint(
            0, 0, new Color(45, 55, 72),
            THUMBNAIL_SIZE, THUMBNAIL_SIZE, new Color(26, 32, 44)
        );
        g2d.setPaint(gradient);
        g2d.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
        
        // Draw play icon circle
        int circleSize = 120;
        int circleX = (THUMBNAIL_SIZE - circleSize) / 2;
        int circleY = (THUMBNAIL_SIZE - circleSize) / 2;
        
        // Semi-transparent white circle
        g2d.setColor(new Color(255, 255, 255, 200));
        g2d.fillOval(circleX, circleY, circleSize, circleSize);
        
        // Draw play triangle
        int[] xPoints = {circleX + 45, circleX + 45, circleX + 85};
        int[] yPoints = {circleY + 35, circleY + 85, circleY + 60};
        g2d.setColor(new Color(45, 55, 72));
        g2d.fillPolygon(xPoints, yPoints, 3);
        
        // Draw filename at bottom
        String filename = videoPath.getFileName().toString();
        if (filename.length() > 30) {
            filename = filename.substring(0, 27) + "...";
        }
        
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 14));
        FontMetrics fm = g2d.getFontMetrics();
        int textWidth = fm.stringWidth(filename);
        int textX = (THUMBNAIL_SIZE - textWidth) / 2;
        g2d.drawString(filename, textX, THUMBNAIL_SIZE - 20);
        
        g2d.dispose();
        
        return thumbnail;
    }
    
    /**
     * Check if thumbnail already exists and is newer than video file
     */
    public boolean thumbnailExists(Path videoPath, Path thumbnailPath) {
        if (!Files.exists(thumbnailPath)) {
            return false;
        }
        
        try {
            long videoModified = Files.getLastModifiedTime(videoPath).toMillis();
            long thumbnailModified = Files.getLastModifiedTime(thumbnailPath).toMillis();
            return thumbnailModified >= videoModified;
        } catch (IOException e) {
            return false;
        }
    }
}
