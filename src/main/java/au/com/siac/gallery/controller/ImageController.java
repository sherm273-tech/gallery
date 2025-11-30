package au.com.siac.gallery.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Controller
public class ImageController {

    @Value("${image.folder}")
    private String imageFolder;

    @Value("${music.folder}")
    private String musicFolder;

    // Request DTO for image list
    public static class ImageListRequest {
        private String startFolder;
        private boolean randomize;
        private boolean shuffleAll;
        private List<String> selectedFolders;

        public String getStartFolder() { return startFolder; }
        public void setStartFolder(String startFolder) { this.startFolder = startFolder; }
        
        public boolean isRandomize() { return randomize; }
        public void setRandomize(boolean randomize) { this.randomize = randomize; }
        
        public boolean isShuffleAll() { return shuffleAll; }
        public void setShuffleAll(boolean shuffleAll) { this.shuffleAll = shuffleAll; }
        
        public List<String> getSelectedFolders() { return selectedFolders; }
        public void setSelectedFolders(List<String> selectedFolders) { this.selectedFolders = selectedFolders; }
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/api/folders/list")
    @ResponseBody
    public List<String> getFolderList() throws IOException {
        Path folderPath = Paths.get(imageFolder);

        // Get all directories recursively
        try (Stream<Path> paths = Files.walk(folderPath)) {
            return paths
                    .filter(Files::isDirectory)
                    .filter(p -> !p.equals(folderPath))
                    .filter(p -> hasImages(p)) // Only include folders that contain images
                    .map(folderPath::relativize)
                    .map(Path::toString)
                    .map(p -> p.replace("\\", "/"))
                    .sorted()
                    .collect(Collectors.toList());
        }
    }

    @GetMapping("/api/music/list")
    @ResponseBody
    public List<String> getMusicList() throws IOException {
        Path folderPath = Paths.get(musicFolder);

        if (!Files.exists(folderPath) || !Files.isDirectory(folderPath)) {
            return new ArrayList<>();
        }

        try (Stream<Path> paths = Files.walk(folderPath)) {
            return paths
                    .filter(Files::isRegularFile)
                    .filter(f -> f.getFileName().toString().toLowerCase().endsWith(".mp3"))
                    .map(folderPath::relativize)
                    .map(Path::toString)
                    .map(p -> p.replace("\\", "/"))
                    .sorted()
                    .collect(Collectors.toList());
        }
    }

    // Helper method to check if a folder contains images
    private boolean hasImages(Path folder) {
        try (Stream<Path> files = Files.list(folder)) {
            return files.anyMatch(f -> Files.isRegularFile(f) && 
                    f.getFileName().toString().toLowerCase()
                            .matches(".*\\.(png|jpg|jpeg|gif|webp)$"));
        } catch (IOException e) {
            return false;
        }
    }

    @PostMapping("/api/images/list")
    @ResponseBody
    public List<String> getImageList(@RequestBody ImageListRequest request) throws IOException {
        String startFolder = request.getStartFolder();
        boolean randomize = request.isRandomize();
        boolean shuffleAll = request.isShuffleAll();
        List<String> selectedFolders = request.getSelectedFolders();
        
        Path folderPath = Paths.get(imageFolder);

        // Collect all image files
        List<Path> allImages;
        try (Stream<Path> paths = Files.walk(folderPath)) {
            allImages = paths
                    .filter(Files::isRegularFile)
                    .filter(f -> f.getFileName().toString().toLowerCase()
                            .matches(".*\\.(png|jpg|jpeg|gif|webp)$"))
                    .collect(Collectors.toList());
        }

        // Filter by selected folders if provided
        if (selectedFolders != null && !selectedFolders.isEmpty()) {
            Set<Path> selectedFolderPaths = selectedFolders.stream()
                    .map(folder -> Paths.get(imageFolder, folder))
                    .collect(Collectors.toSet());
            
            allImages = allImages.stream()
                    .filter(image -> selectedFolderPaths.contains(image.getParent()))
                    .collect(Collectors.toList());
        }

        // If shuffleAll is true, just shuffle everything and return
        if (shuffleAll) {
            List<String> result = allImages.stream()
                    .map(folderPath::relativize)
                    .map(Path::toString)
                    .map(p -> p.replace("\\", "/"))
                    .collect(Collectors.toList());
            Collections.shuffle(result);
            return result;
        }

        // Group images by their immediate parent folder
        Map<Path, List<Path>> imagesByFolder = allImages.stream()
                .collect(Collectors.groupingBy(Path::getParent));

        // Get list of folders
        List<Path> folders = new ArrayList<>();
        
        // If selectedFolders is provided and not empty, use that order
        if (selectedFolders != null && !selectedFolders.isEmpty()) {
            for (String folder : selectedFolders) {
                Path folderFullPath = Paths.get(imageFolder, folder);
                if (imagesByFolder.containsKey(folderFullPath)) {
                    folders.add(folderFullPath);
                }
            }
        } else {
            // Otherwise use all folders with images
            folders = new ArrayList<>(imagesByFolder.keySet());
            folders.sort(Comparator.comparing(Path::toString));
        }

        // If startFolder is specified, move it to the front
        if (startFolder != null && !startFolder.isEmpty()) {
            Path startFolderPath = Paths.get(imageFolder, startFolder);
            
            // Remove the start folder from the list if it exists
            folders.removeIf(folder -> folder.equals(startFolderPath));
            
            // Shuffle remaining folders if selectedFolders was not provided
            if (selectedFolders == null || selectedFolders.isEmpty()) {
                Collections.shuffle(folders);
            }
            
            // Add start folder at the beginning only if it has images
            if (imagesByFolder.containsKey(startFolderPath)) {
                folders.add(0, startFolderPath);
            }
        } else {
            // No start folder specified, shuffle only if no explicit folder order
            if (selectedFolders == null || selectedFolders.isEmpty()) {
                Collections.shuffle(folders);
            }
        }

        // Build final list with ordered folders
        List<String> result = new ArrayList<>();
        for (Path folder : folders) {
            if (imagesByFolder.containsKey(folder)) {
                Stream<String> folderImagesStream = imagesByFolder.get(folder).stream()
                        .map(folderPath::relativize)
                        .map(Path::toString)
                        .map(p -> p.replace("\\", "/"));
                
                // Sort or randomize based on parameter
                List<String> folderImages;
                if (randomize) {
                    folderImages = folderImagesStream.collect(Collectors.toList());
                    Collections.shuffle(folderImages);
                } else {
                    folderImages = folderImagesStream.sorted().collect(Collectors.toList());
                }
                
                result.addAll(folderImages);
            }
        }

        return result;
    }

    @GetMapping("/images/**")
    @ResponseBody
    public Resource getImage(HttpServletRequest request) throws MalformedURLException {
        String pathWithinHandler = (String) request.getAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatchPattern = (String) request.getAttribute(
                HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);

        String relativePath = new AntPathMatcher()
                .extractPathWithinPattern(bestMatchPattern, pathWithinHandler);

        // Decode URL-encoded path (e.g., %20 becomes space)
        relativePath = URLDecoder.decode(relativePath, StandardCharsets.UTF_8);

        // Use Paths.get with the relative path directly
        Path filePath = Paths.get(imageFolder).resolve(relativePath);

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new RuntimeException("File not found: " + filePath.toAbsolutePath());
        }

        return new UrlResource(filePath.toUri());
    }

    @GetMapping("/music/**")
    public ResponseEntity<Resource> getMusic(
            HttpServletRequest request,
            @RequestHeader(value = "Range", required = false) String rangeHeader) throws IOException {
        
        String pathWithinHandler = (String) request.getAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatchPattern = (String) request.getAttribute(
                HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);

        String relativePath = new AntPathMatcher()
                .extractPathWithinPattern(bestMatchPattern, pathWithinHandler);

        // Decode URL-encoded path (e.g., %20 becomes space)
        relativePath = URLDecoder.decode(relativePath, StandardCharsets.UTF_8);

        // Use Paths.get with the relative path directly
        Path filePath = Paths.get(musicFolder).resolve(relativePath);

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new RuntimeException("Music file not found: " + filePath.toAbsolutePath());
        }

        Resource resource = new UrlResource(filePath.toUri());
        long fileSize = Files.size(filePath);

        // Handle range requests for streaming (required for many Smart TVs/monitors)
        if (rangeHeader != null && rangeHeader.startsWith("bytes=")) {
            String[] ranges = rangeHeader.substring(6).split("-");
            long start = Long.parseLong(ranges[0]);
            long end = ranges.length > 1 && !ranges[1].isEmpty() 
                    ? Long.parseLong(ranges[1]) 
                    : fileSize - 1;

            long contentLength = end - start + 1;

            InputStream inputStream = Files.newInputStream(filePath);
            inputStream.skip(start);

            return ResponseEntity.status(206) // 206 Partial Content
                    .header("Content-Type", "audio/mpeg")
                    .header("Accept-Ranges", "bytes")
                    .header("Content-Range", "bytes " + start + "-" + end + "/" + fileSize)
                    .header("Content-Length", String.valueOf(contentLength))
                    .body(new InputStreamResource(inputStream));
        }

        // Normal response (full file)
        return ResponseEntity.ok()
                .header("Content-Type", "audio/mpeg")
                .header("Accept-Ranges", "bytes")
                .header("Content-Length", String.valueOf(fileSize))
                .body(resource);
    }
}