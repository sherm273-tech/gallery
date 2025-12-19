package au.com.siac.gallery.slideshow.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Controller;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
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

    private static final String SESSION_IMAGE_QUEUE = "imageQueue";
    private static final String SESSION_SHOWN_IMAGES = "shownImages";
    private static final String SESSION_REQUEST_PARAMS = "requestParams";
    private static final String SESSION_ALL_IMAGES = "allImages";

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

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            ImageListRequest that = (ImageListRequest) o;
            return randomize == that.randomize &&
                   shuffleAll == that.shuffleAll &&
                   Objects.equals(startFolder, that.startFolder) &&
                   Objects.equals(selectedFolders, that.selectedFolders);
        }

        @Override
        public int hashCode() {
            return Objects.hash(startFolder, randomize, shuffleAll, selectedFolders);
        }
    }

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/api/folders/list")
    @ResponseBody
    public List<String> getFolderList() throws IOException {
        Path folderPath = Paths.get(imageFolder);

        // Get all directories recursively that have direct images
        try (Stream<Path> paths = Files.walk(folderPath)) {
            List<Path> foldersWithDirectImages = paths
                    .filter(Files::isDirectory)
                    .filter(p -> !p.equals(folderPath))
                    .filter(this::hasImagesDirectly)
                    .collect(Collectors.toList());
            
            // Convert to relative paths and return
            List<String> folders = foldersWithDirectImages.stream()
                    .map(folderPath::relativize)
                    .map(Path::toString)
                    .map(p -> p.replace("\\", "/"))
                    .sorted()
                    .collect(Collectors.toList());
            
            return folders;
        }
    }

    // Helper method to check if a folder DIRECTLY contains images (not in subfolders)
    private boolean hasImagesDirectly(Path folder) {
        try {
            List<Path> allFiles = new ArrayList<>();
            try (Stream<Path> files = Files.list(folder)) {
                allFiles = files.collect(Collectors.toList());
            }
            
            String relativePath = Paths.get(imageFolder).relativize(folder).toString().replace("\\", "/");
            
            // Filter for image files (excluding Mac metadata files starting with ._ )
            List<Path> imageFiles = allFiles.stream()
                    .filter(Files::isRegularFile)
                    .filter(f -> {
                        String filename = f.getFileName().toString();
                        // Skip Mac metadata files
                        if (filename.startsWith("._")) {
                            return false;
                        }
                        String filenameLower = filename.toLowerCase();
                        return filenameLower.matches(".*\\.(png|jpg|jpeg|gif|webp)$");
                    })
                    .collect(Collectors.toList());
            
            return !imageFiles.isEmpty();
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    @PostMapping("/api/images/list")
    @ResponseBody
    public List<String> getImageList(@RequestBody ImageListRequest request, HttpSession session) throws IOException {
        // Check if parameters have changed - if so, reset session
        ImageListRequest previousRequest = (ImageListRequest) session.getAttribute(SESSION_REQUEST_PARAMS);
        if (previousRequest == null || !previousRequest.equals(request)) {
            session.removeAttribute(SESSION_IMAGE_QUEUE);
            session.removeAttribute(SESSION_SHOWN_IMAGES);
            session.removeAttribute(SESSION_ALL_IMAGES);
            session.setAttribute(SESSION_REQUEST_PARAMS, request);
        }

        // Get or initialize the image queue
        @SuppressWarnings("unchecked")
        List<String> imageQueue = (List<String>) session.getAttribute(SESSION_IMAGE_QUEUE);
        
        @SuppressWarnings("unchecked")
        Set<String> shownImages = (Set<String>) session.getAttribute(SESSION_SHOWN_IMAGES);
        
        @SuppressWarnings("unchecked")
        List<String> allImages = (List<String>) session.getAttribute(SESSION_ALL_IMAGES);
        
        if (imageQueue == null || imageQueue.isEmpty()) {
            // Generate new queue
            imageQueue = generateImageList(request);
            allImages = new ArrayList<>(imageQueue);
            shownImages = new HashSet<>();
            
            session.setAttribute(SESSION_IMAGE_QUEUE, new ArrayList<>(imageQueue));
            session.setAttribute(SESSION_ALL_IMAGES, allImages);
            session.setAttribute(SESSION_SHOWN_IMAGES, shownImages);
        }

        return new ArrayList<>(imageQueue);
    }

    @PostMapping("/api/images/next")
    @ResponseBody
    public Map<String, Object> getNextImage(@RequestBody ImageListRequest request, HttpSession session) throws IOException {
        @SuppressWarnings("unchecked")
        List<String> imageQueue = (List<String>) session.getAttribute(SESSION_IMAGE_QUEUE);
        
        @SuppressWarnings("unchecked")
        Set<String> shownImages = (Set<String>) session.getAttribute(SESSION_SHOWN_IMAGES);
        
        @SuppressWarnings("unchecked")
        List<String> allImages = (List<String>) session.getAttribute(SESSION_ALL_IMAGES);

        Map<String, Object> response = new HashMap<>();

        // If queue is empty but we have shown images, it means cycle is complete
        if ((imageQueue == null || imageQueue.isEmpty()) && shownImages != null && !shownImages.isEmpty()) {
            // Regenerate queue with remaining images (those not shown)
            if (allImages == null) {
                allImages = generateImageList(request);
                session.setAttribute(SESSION_ALL_IMAGES, allImages);
            }
            
            // Create new queue from images not yet shown
            imageQueue = new ArrayList<>();
            for (String img : allImages) {
                if (!shownImages.contains(img)) {
                    imageQueue.add(img);
                }
            }
            
            // If all images have been shown, reset and start new cycle
            if (imageQueue.isEmpty()) {
                System.out.println("🔄 CYCLE COMPLETE - All " + shownImages.size() + " images shown once. Starting new cycle.");
                shownImages.clear();
                imageQueue = new ArrayList<>(allImages);
                response.put("cycleComplete", true);
            } else {
                System.out.println("⚠️ Queue rebuilt: " + imageQueue.size() + " remaining, " + shownImages.size() + " already shown");
            }
            
            session.setAttribute(SESSION_IMAGE_QUEUE, imageQueue);
            session.setAttribute(SESSION_SHOWN_IMAGES, shownImages);
        }

        if (imageQueue == null || imageQueue.isEmpty()) {
            response.put("image", null);
            response.put("hasMore", false);
            response.put("cycleComplete", true);
            return response;
        }

        // Get next image from queue
        String nextImage = imageQueue.remove(0);
        
        // VERIFICATION: Check if image was already shown (should NEVER happen)
        if (shownImages.contains(nextImage)) {
            System.err.println("❌ ERROR: Duplicate image detected!");
            System.err.println("   Image: " + nextImage);
            System.err.println("   Already shown: " + shownImages.size() + " images");
            System.err.println("   Queue size: " + imageQueue.size());
        }
        
        shownImages.add(nextImage);

        // Update session
        session.setAttribute(SESSION_IMAGE_QUEUE, imageQueue);
        session.setAttribute(SESSION_SHOWN_IMAGES, shownImages);
        
        // Log progress every 10 images
        int totalImages = allImages != null ? allImages.size() : 0;
        if (totalImages > 0 && shownImages.size() % 10 == 0) {
            System.out.println("📊 Slideshow progress: " + shownImages.size() + "/" + totalImages + " images shown");
        }

        response.put("image", nextImage);
        response.put("hasMore", !imageQueue.isEmpty());
        response.put("remaining", imageQueue.size());
        response.put("totalShown", shownImages.size());
        response.put("totalImages", totalImages);
        response.put("cycleComplete", false);

        return response;
    }

    @PostMapping("/api/images/reset")
    @ResponseBody
    public Map<String, String> resetImageSession(HttpSession session) {
        session.removeAttribute(SESSION_IMAGE_QUEUE);
        session.removeAttribute(SESSION_SHOWN_IMAGES);
        session.removeAttribute(SESSION_REQUEST_PARAMS);
        session.removeAttribute(SESSION_ALL_IMAGES);
        
        Map<String, String> response = new HashMap<>();
        response.put("status", "reset");
        return response;
    }

    private List<String> generateImageList(ImageListRequest request) throws IOException {
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
}
