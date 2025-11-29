package au.com.siac.gallery.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Controller;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Controller
public class ImageController {

    @Value("${image.folder}")
    private String imageFolder;  // e.g., C:/gallery

    @GetMapping("/")
    public String index() {
        System.out.println("=== Index page requested ===");
        return "index";
    }

    // Returns all images recursively from subfolders with randomized subfolder order
    @GetMapping("/api/images/list")
    @ResponseBody
    public List<String> getImageList() throws IOException {
        System.out.println("=== Getting image list ===");
        System.out.println("Image folder: " + imageFolder);
        
        Path folderPath = Paths.get(imageFolder);
        System.out.println("Folder path exists: " + Files.exists(folderPath));
        System.out.println("Folder path is directory: " + Files.isDirectory(folderPath));

        // Collect all image files with their paths
        List<Path> allImages;
        try (Stream<Path> paths = Files.walk(folderPath)) {
            allImages = paths
                    .filter(Files::isRegularFile)
                    .filter(f -> {
                        String fileName = f.getFileName().toString().toLowerCase();
                        boolean matches = fileName.matches(".*\\.(png|jpg|jpeg|gif|webp)$");
                        if (matches) {
                            System.out.println("Found image: " + f);
                        }
                        return matches;
                    })
                    .collect(Collectors.toList());
        }

        System.out.println("Total images found: " + allImages.size());

        // Group images by their immediate parent folder
        Map<Path, List<Path>> imagesByFolder = allImages.stream()
                .collect(Collectors.groupingBy(Path::getParent));

        System.out.println("Number of folders: " + imagesByFolder.size());
        imagesByFolder.keySet().forEach(folder -> 
            System.out.println("  Folder: " + folder + " -> " + imagesByFolder.get(folder).size() + " images")
        );

        // Get list of folders and shuffle them randomly
        List<Path> folders = new ArrayList<>(imagesByFolder.keySet());
        Collections.shuffle(folders);

        System.out.println("Shuffled folder order:");
        folders.forEach(folder -> System.out.println("  " + folder));

        // Build final list: iterate through randomized folders,
        // add their images in sorted order
        List<String> result = new ArrayList<>();
        for (Path folder : folders) {
            List<String> folderImages = imagesByFolder.get(folder).stream()
                    .map(folderPath::relativize)
                    .map(Path::toString)
                    .map(p -> p.replace("\\", "/"))
                    .sorted()
                    .collect(Collectors.toList());
            result.addAll(folderImages);
        }

        System.out.println("Total images in result: " + result.size());
        System.out.println("First 5 images:");
        result.stream().limit(5).forEach(img -> System.out.println("  " + img));
        System.out.println("=== End image list ===\n");

        return result;
    }

    // Serves image by URL
    @GetMapping("/images/**")
    @ResponseBody
    public Resource getImage(HttpServletRequest request) throws MalformedURLException {
        System.out.println("=== Image requested ===");
        
        String pathWithinHandler = (String) request.getAttribute(
                HandlerMapping.PATH_WITHIN_HANDLER_MAPPING_ATTRIBUTE);
        String bestMatchPattern = (String) request.getAttribute(
                HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);

        System.out.println("Path within handler: " + pathWithinHandler);
        System.out.println("Best matching pattern: " + bestMatchPattern);

        String relativePath = new AntPathMatcher()
                .extractPathWithinPattern(bestMatchPattern, pathWithinHandler);

        System.out.println("Relative path: " + relativePath);

        Path filePath = Paths.get(imageFolder, relativePath.split("/"));
        System.out.println("Full file path: " + filePath.toAbsolutePath());
        System.out.println("File exists: " + Files.exists(filePath));
        System.out.println("Is regular file: " + Files.isRegularFile(filePath));

        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            System.out.println("ERROR: File not found or not a regular file!");
            throw new RuntimeException("File not found: " + filePath.toAbsolutePath());
        }

        System.out.println("Serving file successfully");
        System.out.println("=== End image request ===\n");
        
        return new UrlResource(filePath.toUri());
    }
}