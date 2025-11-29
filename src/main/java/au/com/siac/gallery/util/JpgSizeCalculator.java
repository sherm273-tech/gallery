package au.com.siac.gallery.util;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;

public class JpgSizeCalculator {

    public static void main(String[] args) {
        // Replace with the source directory path
        String sourceDirPath = "F:\\DCIM";
        Path sourcePath = Paths.get(sourceDirPath);

        if (!Files.exists(sourcePath) || !Files.isDirectory(sourcePath)) {
            System.out.println("Source directory does not exist or is not a directory.");
            return;
        }

        try {
            long totalSize = calculateJpgSize(sourcePath);
            System.out.println("Total size of all JPG files: " + humanReadableByteCount(totalSize));
        } catch (IOException e) {
            System.err.println("Error calculating JPG sizes: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static long calculateJpgSize(Path sourcePath) throws IOException {
        final long[] totalSize = {0};

        Files.walkFileTree(sourcePath, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                if (Files.isRegularFile(file) && file.toString().toLowerCase().endsWith(".jpg")) {
                    long size = Files.size(file);
                    totalSize[0] += size;
                    System.out.println("Found: " + file + " (" + humanReadableByteCount(size) + ")");
                }
                return FileVisitResult.CONTINUE;
            }
        });

        return totalSize[0];
    }

    // Convert bytes to human-readable format
    private static String humanReadableByteCount(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        char pre = "KMGTPE".charAt(exp - 1);
        return String.format("%.2f %sB", bytes / Math.pow(1024, exp), pre);
    }
}
