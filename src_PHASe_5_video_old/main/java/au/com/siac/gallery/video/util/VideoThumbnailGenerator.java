package au.com.siac.gallery.video.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Utility class for generating video thumbnails using FFmpeg
 * Extracts real frames from video files
 */
@Component
public class VideoThumbnailGenerator {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoThumbnailGenerator.class);
    
    private static final int THUMBNAIL_WIDTH = 640;  // Width of generated thumbnails
    
    /**
     * Generate a thumbnail for a video file using FFmpeg
     * Extracts a frame at 5 seconds into the video
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
            
            // Check if thumbnail already exists and is newer than video
            if (thumbnailExists(videoPath, thumbnailPath)) {
                logger.debug("Thumbnail already exists and is up-to-date: {}", thumbnailPath);
                return true;
            }
            
            // Try to generate using FFmpeg first
            if (generateWithFFmpeg(videoPath, thumbnailPath)) {
                return true;
            }
            
            // Fallback to placeholder if FFmpeg fails
            logger.warn("FFmpeg failed, generating placeholder thumbnail for: {}", videoPath);
            return generatePlaceholderThumbnail(videoPath, thumbnailPath);
            
        } catch (Exception e) {
            logger.error("Failed to generate video thumbnail for: " + videoPath, e);
            return false;
        }
    }
    
    /**
     * Generate thumbnail using FFmpeg with play icon overlay
     */
    private boolean generateWithFFmpeg(Path videoPath, Path thumbnailPath) {
        try {
            logger.info("Generating FFmpeg thumbnail with play icon for: {}", videoPath.getFileName());
            
            // Create drawtext filter for play icon
            // The play icon is a triangle made with Unicode character or custom drawing
            String playIconFilter = String.format(
                "scale=%d:-1," +
                "drawbox=x=10:y=h-60:w=50:h=50:color=black@0.7:t=fill," +  // Semi-transparent black box
                "drawbox=x=10:y=h-60:w=50:h=50:color=white@0.2:t=2," +      // White border
                "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:text='▶':fontsize=32:fontcolor=white:x=22:y=h-48:borderw=1:bordercolor=black@0.8",
                THUMBNAIL_WIDTH
            );
            
            ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg",
                "-i", videoPath.toString(),
                "-ss", "00:00:05",                      // Seek to 5 seconds
                "-vframes", "1",                         // Extract 1 frame
                "-vf", playIconFilter,                   // Apply scale + play icon overlay
                "-q:v", "2",                             // High quality JPEG
                thumbnailPath.toString(),
                "-y"                                     // Overwrite if exists
            );
            
            processBuilder.redirectErrorStream(true);
            Process process = processBuilder.start();
            
            // Read output (for debugging errors)
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }
            
            int exitCode = process.waitFor();
            
            if (exitCode == 0 && Files.exists(thumbnailPath)) {
                long size = Files.size(thumbnailPath);
                logger.info("✅ FFmpeg thumbnail with play icon generated: {} ({} KB)", 
                    thumbnailPath.getFileName(), size / 1024);
                return true;
            } else {
                logger.error("FFmpeg failed with exit code {}: {}", exitCode, output.toString());
                return false;
            }
            
        } catch (Exception e) {
            logger.error("FFmpeg execution failed: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Generate placeholder thumbnail as fallback
     */
    private boolean generatePlaceholderThumbnail(Path videoPath, Path thumbnailPath) {
        try {
            BufferedImage thumbnail = createVideoPlaceholderImage(videoPath);
            File outputFile = thumbnailPath.toFile();
            ImageIO.write(thumbnail, "jpg", outputFile);
            logger.debug("Generated placeholder thumbnail for: {}", videoPath.getFileName());
            return true;
        } catch (IOException e) {
            logger.error("Failed to generate placeholder thumbnail", e);
            return false;
        }
    }
    
    /**
     * Create a placeholder thumbnail with video icon
     * Used as fallback when FFmpeg is not available
     */
    private BufferedImage createVideoPlaceholderImage(Path videoPath) {
        int size = 400;
        BufferedImage thumbnail = new BufferedImage(size, size, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = thumbnail.createGraphics();
        
        // Enable anti-aliasing
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        
        // Dark gradient background
        GradientPaint gradient = new GradientPaint(
            0, 0, new Color(45, 55, 72),
            size, size, new Color(26, 32, 44)
        );
        g2d.setPaint(gradient);
        g2d.fillRect(0, 0, size, size);
        
        // Draw play icon circle
        int circleSize = 120;
        int circleX = (size - circleSize) / 2;
        int circleY = (size - circleSize) / 2;
        
        g2d.setColor(new Color(255, 255, 255, 200));
        g2d.fillOval(circleX, circleY, circleSize, circleSize);
        
        // Draw play triangle
        int[] xPoints = {circleX + 45, circleX + 45, circleX + 85};
        int[] yPoints = {circleY + 35, circleY + 85, circleY + 60};
        g2d.setColor(new Color(45, 55, 72));
        g2d.fillPolygon(xPoints, yPoints, 3);
        
        // Add small play icon in bottom-left corner (matching FFmpeg version)
        int iconX = 10;
        int iconY = size - 60;
        int iconSize = 50;
        
        // Semi-transparent black box
        g2d.setColor(new Color(0, 0, 0, 180));
        g2d.fillRoundRect(iconX, iconY, iconSize, iconSize, 5, 5);
        
        // White border
        g2d.setColor(new Color(255, 255, 255, 50));
        g2d.setStroke(new BasicStroke(2));
        g2d.drawRoundRect(iconX, iconY, iconSize, iconSize, 5, 5);
        
        // Play triangle in corner
        int triX = iconX + 15;
        int triY = iconY + 12;
        int[] cornerXPoints = {triX, triX, triX + 20};
        int[] cornerYPoints = {triY, triY + 26, triY + 13};
        g2d.setColor(Color.WHITE);
        g2d.fillPolygon(cornerXPoints, cornerYPoints, 3);
        
        // Draw filename
        String filename = videoPath.getFileName().toString();
        if (filename.length() > 30) {
            filename = filename.substring(0, 27) + "...";
        }
        
        g2d.setColor(Color.WHITE);
        g2d.setFont(new Font("SansSerif", Font.BOLD, 14));
        FontMetrics fm = g2d.getFontMetrics();
        int textWidth = fm.stringWidth(filename);
        int textX = (size - textWidth) / 2;
        g2d.drawString(filename, textX, size - 20);
        
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
    
    /**
     * Check if FFmpeg is available on the system
     */
    public boolean isFFmpegAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("ffmpeg", "-version");
            Process process = pb.start();
            int exitCode = process.waitFor();
            boolean available = (exitCode == 0);
            
            if (available) {
                logger.info("✅ FFmpeg is available");
            } else {
                logger.warn("⚠️ FFmpeg is not available - will use placeholder thumbnails");
            }
            
            return available;
        } catch (Exception e) {
            logger.warn("⚠️ FFmpeg is not available - will use placeholder thumbnails");
            return false;
        }
    }
}
