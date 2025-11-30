package au.com.siac.gallery.util;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;

public class DuplicateFileAnalyzer {

    public static void main(String[] args) throws IOException, NoSuchAlgorithmException {
        // Hard-coded directories
        File dir1 = new File("E:\\Blue Hard Disk Drive\\On 9 Sept\\Photos");
        File dir2 = new File("E:\\Blue Hard Disk Drive\\Photos");
        File dir3 = new File("E:\\Blue Hard Disk Drive\\Photoss");

        Map<String, File> hashToFileMap = new HashMap<>(); // Maps hash to one example file
        Map<String, Integer> hashCountMap = new HashMap<>(); // Maps hash to count of occurrences
        System.out.println("Running! ...");
        // Process each directory
        processDirectory(dir1, hashToFileMap, hashCountMap);
        processDirectory(dir2, hashToFileMap, hashCountMap);
        processDirectory(dir3, hashToFileMap, hashCountMap);

        // Count duplicates (hash appears more than once)
        long duplicateCount = hashCountMap.values().stream().filter(c -> c > 1).count();

        // Calculate total size of unique files
        long totalUniqueSize = hashToFileMap.values().stream().mapToLong(File::length).sum();

        System.out.println("Total duplicate files: " + duplicateCount);
        System.out.println("Total size of unique files: " + totalUniqueSize + " bytes");
    }

    private static void processDirectory(File dir, Map<String, File> hashToFileMap, Map<String, Integer> hashCountMap) 
            throws IOException, NoSuchAlgorithmException {
        if (!dir.exists() || !dir.isDirectory()) return;

        for (File file : dir.listFiles()) {
            if (file.isDirectory()) {
                processDirectory(file, hashToFileMap, hashCountMap);
            } else if (file.isFile()) {
                String hash = computeFileHash(file);

                hashToFileMap.putIfAbsent(hash, file);
                hashCountMap.put(hash, hashCountMap.getOrDefault(hash, 0) + 1);
            }
        }
    }

    private static String computeFileHash(File file) throws IOException, NoSuchAlgorithmException {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = fis.read(buffer)) != -1) {
                digest.update(buffer, 0, read);
            }
        }

        byte[] hashBytes = digest.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : hashBytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
