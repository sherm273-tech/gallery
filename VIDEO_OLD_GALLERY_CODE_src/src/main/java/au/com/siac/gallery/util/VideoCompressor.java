package au.com.siac.gallery.util;

import java.io.*;
import java.nio.file.*;
import java.util.*;

public class VideoCompressor {

    private static final Path SOURCE_ROOT = Paths.get("E:\\gallery");
    private static final Path ARCHIVE_ROOT = Paths.get("E:\\original_gallery_video");

    // Only compress videos >= 200 MB
    private static final long MIN_FILE_SIZE_BYTES = 200L * 1024 * 1024;

    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            "mp4", "mov", "avi", "mkv", "wmv", "flv", "mpeg", "mpg", "m4v"
    );

    public static void main(String[] args) throws IOException {
        Files.walk(SOURCE_ROOT)
                .filter(Files::isRegularFile)
                .filter(VideoCompressor::isVideoFile)
                .filter(VideoCompressor::isLargeEnough)
                .forEach(VideoCompressor::processVideo);

        System.out.println("Finished processing large videos.");
    }

    private static boolean isVideoFile(Path path) {
        String name = path.getFileName().toString().toLowerCase();
        int dot = name.lastIndexOf('.');
        return dot > 0 && VIDEO_EXTENSIONS.contains(name.substring(dot + 1));
    }

    private static boolean isLargeEnough(Path path) {
        try {
            return Files.size(path) >= MIN_FILE_SIZE_BYTES;
        } catch (IOException e) {
            return false;
        }
    }

    private static void processVideo(Path videoPath) {
        try {
            System.out.println("Compressing: " + videoPath);

            Path parentDir = videoPath.getParent();
            String baseName = getBaseName(videoPath.getFileName().toString());

            Path compressedOutput = parentDir.resolve(baseName + "_compressed.mp4");

            List<String> command = List.of(
                    "ffmpeg",
                    "-i", videoPath.toString(),
                    "-vf", "scale=1280:720",
                    "-c:v", "libx264",
                    "-preset", "medium",
                    "-crf", "23",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    compressedOutput.toString()
            );

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.inheritIO();
            Process process = pb.start();

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                System.err.println("ffmpeg failed for: " + videoPath);
                return;
            }

            // Preserve directory structure when archiving original
            Path relativePath = SOURCE_ROOT.relativize(videoPath);
            Path archivePath = ARCHIVE_ROOT.resolve("gallery").resolve(relativePath);

            Files.createDirectories(archivePath.getParent());
            Files.move(videoPath, archivePath, StandardCopyOption.REPLACE_EXISTING);

            System.out.println("Original moved to: " + archivePath);

        } catch (Exception e) {
            System.err.println("Error processing: " + videoPath);
            e.printStackTrace();
        }
    }

    private static String getBaseName(String filename) {
        int dot = filename.lastIndexOf('.');
        return (dot == -1) ? filename : filename.substring(0, dot);
    }
}

