package au.com.siac.gallery.util;

import java.io.File;

public class FolderSizes {

    public static void main(String[] args) {
        // Change this to the directory you want to scan
        String rootPath = "C:\\Users\\sherm\\AppData\\Local";
        File rootDir = new File(rootPath);

        if (!rootDir.exists() || !rootDir.isDirectory()) {
            System.out.println("Invalid directory: " + rootPath);
            return;
        }

        listFolderSizes(rootDir, 0);
    }

    /**
     * Recursively lists subfolder sizes.
     *
     * @param dir   The directory to scan
     * @param level Depth level for pretty printing
     * @return total size of this directory
     */
    private static long listFolderSizes(File dir, int level) {
        long totalSize = 0;

        File[] files = dir.listFiles();
        if (files == null) return 0;

        for (File file : files) {
            if (file.isFile()) {
                totalSize += file.length();
            } else if (file.isDirectory()) {
                totalSize += listFolderSizes(file, level + 1);
            }
        }

        // Only output if folder size >= 1 GB
        double sizeInGB = totalSize / (1024.0 * 1024.0 * 1024.0);
        if (sizeInGB >= 1.0) {
            String indent = "  ".repeat(level);
            System.out.printf("%s%s: %.2f GB%n", indent, dir.getName(), sizeInGB);
        }

        return totalSize;
    }
}
