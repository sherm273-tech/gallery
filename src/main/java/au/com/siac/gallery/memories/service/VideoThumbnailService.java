package au.com.siac.gallery.memories.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Service for generating video thumbnails using FFmpeg
 */
@Service
public class VideoThumbnailService {
    
    @Value("${image.folder}")
    private String imageFolder;
    
    /**
     * Generate thumbnail for a video file
     * 
     * @param videoFilePath Relative path to video file (e.g., "europe/MVI_9317.MP4")
     * @return Relative path to generated thumbnail, or null if failed
     */
    public String generateThumbnail(String videoFilePath) {
        try {
            // Build full paths
            Path videoPath = Paths.get(imageFolder, videoFilePath);
            
            if (!Files.exists(videoPath)) {
                System.err.println("[VideoThumbnailService] Video file not found: " + videoPath);
                return null;
            }
            
            // Create thumbnails directory if it doesn't exist
            Path thumbnailsDir = Paths.get(imageFolder, "thumbnails");
            if (!Files.exists(thumbnailsDir)) {
                Files.createDirectories(thumbnailsDir);
                System.out.println("[VideoThumbnailService] Created thumbnails directory: " + thumbnailsDir);
            }
            
            // Generate thumbnail filename: europe/MVI_9317.MP4 -> thumbnails/europe_MVI_9317.jpg
            String thumbnailFilename = videoFilePath
                    .replace("/", "_")
                    .replace("\\", "_")
                    .replaceAll("\\.(mp4|MP4|mov|MOV|avi|AVI|mkv|MKV)$", ".jpg");
            
            Path thumbnailPath = thumbnailsDir.resolve(thumbnailFilename);
            String thumbnailRelativePath = "thumbnails/" + thumbnailFilename;
            
            // Check if thumbnail already exists
            if (Files.exists(thumbnailPath)) {
                System.out.println("[VideoThumbnailService] Thumbnail already exists: " + thumbnailRelativePath);
                return thumbnailRelativePath;
            }
            
            System.out.println("[VideoThumbnailService] Generating thumbnail for: " + videoFilePath);
            System.out.println("[VideoThumbnailService] Output: " + thumbnailRelativePath);
            
            // Build FFmpeg command
            // Extract frame at 5 seconds, scale to 640px width (maintains aspect ratio)
            ProcessBuilder processBuilder = new ProcessBuilder(
                "ffmpeg",
                "-i", videoPath.toString(),
                "-ss", "00:00:05",              // Seek to 5 seconds
                "-vframes", "1",                 // Extract 1 frame
                "-vf", "scale=640:-1",          // Scale to 640px width, auto height
                "-q:v", "2",                     // High quality JPEG
                thumbnailPath.toString(),
                "-y"                             // Overwrite if exists
            );
            
            processBuilder.redirectErrorStream(true);
            
            Process process = processBuilder.start();
            
            // Read output for debugging
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    // Only log important messages (errors/warnings)
                    if (line.contains("Error") || line.contains("error") || 
                        line.contains("Warning") || line.contains("warning")) {
                        System.out.println("[FFmpeg] " + line);
                    }
                }
            }
            
            int exitCode = process.waitFor();
            
            if (exitCode == 0 && Files.exists(thumbnailPath)) {
                long thumbnailSize = Files.size(thumbnailPath);
                System.out.println("[VideoThumbnailService] ✅ Thumbnail generated successfully: " + 
                                 thumbnailRelativePath + " (" + (thumbnailSize / 1024) + " KB)");
                return thumbnailRelativePath;
            } else {
                System.err.println("[VideoThumbnailService] ❌ FFmpeg failed with exit code: " + exitCode);
                return null;
            }
            
        } catch (Exception e) {
            System.err.println("[VideoThumbnailService] ❌ Error generating thumbnail: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Check if FFmpeg is installed and available
     * 
     * @return true if FFmpeg is available, false otherwise
     */
    public boolean isFFmpegAvailable() {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder("ffmpeg", "-version");
            Process process = processBuilder.start();
            int exitCode = process.waitFor();
            return exitCode == 0;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Get FFmpeg version info
     * 
     * @return FFmpeg version string, or null if not available
     */
    public String getFFmpegVersion() {
        try {
            ProcessBuilder processBuilder = new ProcessBuilder("ffmpeg", "-version");
            Process process = processBuilder.start();
            
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream()))) {
                String firstLine = reader.readLine();
                return firstLine != null ? firstLine : "Unknown version";
            }
        } catch (Exception e) {
            return null;
        }
    }
}
