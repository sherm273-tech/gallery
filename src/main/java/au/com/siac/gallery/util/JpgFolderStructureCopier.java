package au.com.siac.gallery.util;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.util.Iterator;

public class JpgFolderStructureCopier {

    public static void main(String[] args) {
        String sourceDirPath = "E:\\Photos South America";
        String targetDirPath = "C:\\gallery\\south_america_2020";

        Path sourcePath = Paths.get(sourceDirPath);
        Path targetPath = Paths.get(targetDirPath);

        if (!Files.exists(sourcePath) || !Files.isDirectory(sourcePath)) {
            System.out.println("Source directory does not exist or is not a directory.");
            return;
        }

        try {
            copyAndCompressJpgFiles(sourcePath, targetPath, 0.8f); // 0.8 = 80% quality
            System.out.println("All JPG files copied and compressed successfully.");
        } catch (IOException e) {
            System.err.println("Error copying JPG files: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void copyAndCompressJpgFiles(Path sourcePath, Path targetPath, float quality) throws IOException {
        Files.walkFileTree(sourcePath, new SimpleFileVisitor<Path>() {

            @Override
            public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                if (Files.isRegularFile(file) && file.toString().toLowerCase().endsWith(".jpg")) {
                    Path relativePath = sourcePath.relativize(file);
                    Path targetFile = targetPath.resolve(relativePath);

                    if (!Files.exists(targetFile.getParent())) {
                        Files.createDirectories(targetFile.getParent());
                    }

                    long originalSize = Files.size(file);
                    compressJpg(file.toFile(), targetFile.toFile(), quality);
                    long newSize = Files.size(targetFile);

                    System.out.printf("Copied & compressed: %s -> %s | Original: %.2f MB | New: %.2f MB%n",
                            file, targetFile, originalSize / (1024.0 * 1024.0), newSize / (1024.0 * 1024.0));
                }
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                Path relativeDir = sourcePath.relativize(dir);
                Path targetDir = targetPath.resolve(relativeDir);
                if (!Files.exists(targetDir)) {
                    Files.createDirectories(targetDir);
                }
                return FileVisitResult.CONTINUE;
            }
        });
    }

    private static void compressJpg(File input, File output, float quality) throws IOException {
        BufferedImage image = ImageIO.read(input);
        if (image == null) {
            System.err.println("Skipping non-image file: " + input);
            return;
        }

        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext())
            throw new IllegalStateException("No writers found for JPG format");

        ImageWriter writer = writers.next();
        ImageOutputStream ios = ImageIO.createImageOutputStream(output);
        writer.setOutput(ios);

        ImageWriteParam param = writer.getDefaultWriteParam();
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(quality); // 0.0 = max compression, 1.0 = max quality
        }

        writer.write(null, new IIOImage(image, null, null), param);

        ios.close();
        writer.dispose();
    }
}

