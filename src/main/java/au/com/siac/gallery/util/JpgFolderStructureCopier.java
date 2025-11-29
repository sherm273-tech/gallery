package au.com.siac.gallery.util;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;

public class JpgFolderStructureCopier {

    public static void main(String[] args) {
        // Source folder (external drive)
        String sourceDirPath = "F:\\DCIM";

        // Target parent folder
        String targetDirPath = "C:\\gallery\\europe";

        Path sourcePath = Paths.get(sourceDirPath);
        Path targetPath = Paths.get(targetDirPath);

        if (!Files.exists(sourcePath) || !Files.isDirectory(sourcePath)) {
            System.out.println("Source directory does not exist or is not a directory.");
            return;
        }

        try {
            copyJpgFilesWithStructure(sourcePath, targetPath);
            System.out.println("All JPG files copied successfully from " + sourcePath + " to " + targetPath);
        } catch (IOException e) {
            System.err.println("Error copying JPG files: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void copyJpgFilesWithStructure(Path sourcePath, Path targetPath) throws IOException {
        Files.walkFileTree(sourcePath, new SimpleFileVisitor<Path>() {

            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                // Only copy .jpg files (case-insensitive)
                if (Files.isRegularFile(file) && file.toString().toLowerCase().endsWith(".jpg")) {
                    // Compute relative path from source folder
                    Path relativePath = sourcePath.relativize(file);
                    Path targetFile = targetPath.resolve(relativePath);

                    // Create parent directories in the target folder if they don't exist
                    if (!Files.exists(targetFile.getParent())) {
                        Files.createDirectories(targetFile.getParent());
                    }

                    // Copy the JPG file
                    Files.copy(file, targetFile, StandardCopyOption.REPLACE_EXISTING);
                    System.out.println("Copied: " + file + " -> " + targetFile);
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                // Create the directory in the target path before visiting files
                Path relativeDir = sourcePath.relativize(dir);
                Path targetDir = targetPath.resolve(relativeDir);
                if (!Files.exists(targetDir)) {
                    Files.createDirectories(targetDir);
                }
                return FileVisitResult.CONTINUE;
            }
        });
    }
}
