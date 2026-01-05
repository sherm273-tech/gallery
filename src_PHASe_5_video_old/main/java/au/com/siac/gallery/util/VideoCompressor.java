package au.com.siac.gallery.util;

import java.io.*;
import java.nio.file.*;
import java.util.*;

/**
 * Utility to compress large video files using FFmpeg
 * 
 * Usage:
 * 1. Install FFmpeg on your system
 * 2. Update SOURCE_ROOT and ARCHIVE_ROOT paths
 * 3. Run: java au.com.siac.gallery.util.VideoCompressor
 * 
 * What it does:
 * - Finds all videos >= 200MB in SOURCE_ROOT
 * - Compresses them to 720p with H.264 codec
 * - Moves originals to ARCHIVE_ROOT (preserves folder structure)
 * - Saves compressed version with "_compressed.mp4" suffix
 */
public class VideoCompressor {
    
    // Configuration
    private static final Path SOURCE_ROOT = Paths.get("E:\\gallery");
    private static final Path ARCHIVE_ROOT = Paths.get("E:\\original_gallery_video");
    
    // Only compress videos >= 200 MB
    private static final long MIN_FILE_SIZE_BYTES = 200L * 1024 * 1024;
    
    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            "mp4", "mov", "avi", "mkv", "wmv", "flv", "mpeg", "mpg", "m4v"
    );
    
    public static void main(String[] args) throws IOException {
        System.out.println("=== Video Compressor ===");
        System.out.println("Source: " + SOURCE_ROOT);
        System.out.println("Archive: " + ARCHIVE_ROOT);
        System.out.println("Min size: " + (MIN_FILE_SIZE_BYTES / 1024 / 1024) + " MB");
        System.out.println("========================\n");
        
        Files.walk(SOURCE_ROOT)
                .filter(Files::isRegularFile)
                .filter(VideoCompressor::isVideoFile)
                .filter(VideoCompressor::isLargeEnough)
                .forEach(VideoCompressor::processVideo);
        
        System.out.println("\nFinished processing large videos.");
    }
    
    /**
     * Check if file is a video based on extension
     */
    private static boolean isVideoFile(Path path) {
        String name = path.getFileName().toString().toLowerCase();
        int dot = name.lastIndexOf('.');
        return dot > 0 && VIDEO_EXTENSIONS.contains(name.substring(dot + 1));
    }
    
    /**
     * Check if file is large enough to compress
     */
    private static boolean isLargeEnough(Path path) {
        try {
            long sizeBytes = Files.size(path);
            long sizeMB = sizeBytes / 1024 / 1024;
            boolean large = sizeBytes >= MIN_FILE_SIZE_BYTES;
            
            if (large) {
                System.out.println("Found large video: " + path.getFileName() + " (" + sizeMB + " MB)");
            }
            
            return large;
        } catch (IOException e) {
            return false;
        }
    }
    
    /**
     * Compress a video file using FFmpeg
     */
    private static void processVideo(Path videoPath) {
        try {
            System.out.println("\n▶ Compressing: " + videoPath);
            
            Path parentDir = videoPath.getParent();
            String baseName = getBaseName(videoPath.getFileName().toString());
            Path compressedOutput = parentDir.resolve(baseName + "_compressed.mp4");
            
            // FFmpeg command to compress video
            // - Scale to 720p (1280x720)
            // - H.264 codec (universal compatibility)
            // - CRF 23 (good quality/size balance)
            // - AAC audio at 128kbps
            List<String> command = List.of(
                    "ffmpeg",
                    "-i", videoPath.toString(),
                    "-vf", "scale=1280:720",      // Scale to 720p
                    "-c:v", "libx264",             // H.264 video codec
                    "-preset", "medium",           // Encoding speed/quality tradeoff
                    "-crf", "23",                  // Constant Rate Factor (quality)
                    "-c:a", "aac",                 // AAC audio codec
                    "-b:a", "128k",                // Audio bitrate
                    compressedOutput.toString()
            );
            
            System.out.println("  Running FFmpeg...");
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.inheritIO();  // Show FFmpeg output
            Process process = pb.start();
            int exitCode = process.waitFor();
            
            if (exitCode != 0) {
                System.err.println("  ❌ FFmpeg failed for: " + videoPath);
                return;
            }
            
            // Calculate compression ratio
            long originalSize = Files.size(videoPath);
            long compressedSize = Files.size(compressedOutput);
            long savedBytes = originalSize - compressedSize;
            int compressionPercent = (int) ((1.0 - ((double) compressedSize / originalSize)) * 100);
            
            System.out.println("  ✅ Compressed successfully");
            System.out.println("  Original:   " + (originalSize / 1024 / 1024) + " MB");
            System.out.println("  Compressed: " + (compressedSize / 1024 / 1024) + " MB");
            System.out.println("  Saved:      " + (savedBytes / 1024 / 1024) + " MB (" + compressionPercent + "%)");
            
            // Archive original file (preserve directory structure)
            Path relativePath = SOURCE_ROOT.relativize(videoPath);
            Path archivePath = ARCHIVE_ROOT.resolve("gallery").resolve(relativePath);
            Files.createDirectories(archivePath.getParent());
            Files.move(videoPath, archivePath, StandardCopyOption.REPLACE_EXISTING);
            
            System.out.println("  📦 Original archived to: " + archivePath);
            
        } catch (Exception e) {
            System.err.println("  ❌ Error processing: " + videoPath);
            e.printStackTrace();
        }
    }
    
    /**
     * Get filename without extension
     */
    private static String getBaseName(String filename) {
        int dot = filename.lastIndexOf('.');
        return (dot == -1) ? filename : filename.substring(0, dot);
    }
}
