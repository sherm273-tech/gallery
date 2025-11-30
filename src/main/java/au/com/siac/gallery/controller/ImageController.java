package au.com.siac.gallery.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Controller;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
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

    @GetMapping("/api/images/list")
    @ResponseBody
    public List<String> getImageList(
            @RequestParam(required = false) String startFolder,
            @RequestParam(required = false, defaultValue = "false") boolean randomize,
            @RequestParam(required = false, defaultValue = "false") boolean shuffleAll) throws IOException {
        
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
        List<Path> folders = new ArrayList<>(imagesByFolder.keySet());
        
        // Sort folders to have consistent ordering before shuffling
        folders.sort(Comparator.comparing(Path::toString));

        // If startFolder is specified, move it to the front
        if (startFolder != null && !startFolder.isEmpty()) {
            Path startFolderPath = Paths.get(imageFolder, startFolder);
            
            // Remove the start folder from the list if it exists
            folders.removeIf(folder -> folder.equals(startFolderPath));
            
            // Shuffle remaining folders
            Collections.shuffle(folders);
            
            // Add start folder at the beginning only if it has images
            if (imagesByFolder.containsKey(startFolderPath)) {
                folders.add(0, startFolderPath);
            }
        } else {
            // No start folder specified, just shuffle all
            Collections.shuffle(folders);
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
}