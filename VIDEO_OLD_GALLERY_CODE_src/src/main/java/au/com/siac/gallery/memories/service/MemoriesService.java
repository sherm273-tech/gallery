package au.com.siac.gallery.memories.service;

import au.com.siac.gallery.memories.entity.PhotoMetadata;
import au.com.siac.gallery.memories.repository.PhotoMetadataRepository;
import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class MemoriesService {
    
    private static final Logger logger = LoggerFactory.getLogger(MemoriesService.class);
    
    @Value("${image.folder}")
    private String imageFolder;
    
    @Value("${memories.thumbnail-size:400}")
    private int thumbnailSize;
    
    @Value("${memories.thumbnail-quality:85}")
    private float thumbnailQuality;
    
    private final PhotoMetadataRepository photoMetadataRepository;
    private final au.com.siac.gallery.video.util.VideoThumbnailGenerator videoThumbnailGenerator;
    private final au.com.siac.gallery.video.util.VideoMetadataExtractor videoMetadataExtractor;
    
    public MemoriesService(PhotoMetadataRepository photoMetadataRepository,
                          au.com.siac.gallery.video.util.VideoThumbnailGenerator videoThumbnailGenerator,
                          au.com.siac.gallery.video.util.VideoMetadataExtractor videoMetadataExtractor) {
        this.photoMetadataRepository = photoMetadataRepository;
        this.videoThumbnailGenerator = videoThumbnailGenerator;
        this.videoMetadataExtractor = videoMetadataExtractor;
    }
    
    
    /**
     * Get photos from today's date in previous years
     */
    public List<Map<String, Object>> getTodaysMemories() {
        LocalDate today = LocalDate.now();
        return getMemoriesForDate(today.getMonthValue(), today.getDayOfMonth());
    }
    
    /**
     * Get photos for a specific month and day
     */
    public List<Map<String, Object>> getMemoriesForDate(int month, int day) {
        List<PhotoMetadata> memories = photoMetadataRepository.findByMonthAndDay(month, day);
        
        return memories.stream()
            .map(this::toMemoryMap)
            .collect(Collectors.toList());
    }
    
    /**
     * Count memories for today
     */
    public long getTodaysMemoryCount() {
        LocalDate today = LocalDate.now();
        return photoMetadataRepository.countByMonthAndDay(today.getMonthValue(), today.getDayOfMonth());
    }
    
    /**
     * Get memory counts for each day in a month
     * Returns map of day (1-31) -> count
     */
    public Map<Integer, Long> getMemoryCountsForMonth(int month) {
        Map<Integer, Long> counts = new HashMap<>();
        
        // Get max days in month (use current year, doesn't matter much)
        int maxDays = 31;
        if (month == 2) {
            maxDays = 29; // Account for leap years
        } else if (month == 4 || month == 6 || month == 9 || month == 11) {
            maxDays = 30;
        }
        
        // Query count for each day
        for (int day = 1; day <= maxDays; day++) {
            long count = photoMetadataRepository.countByMonthAndDay(month, day);
            if (count > 0) {
                counts.put(day, count);
            }
        }
        
        return counts;
    }
    
    /**
     * Index a single photo file
     */
    public PhotoMetadata indexPhoto(String relativePath) {
        Path mediaPath = Paths.get(imageFolder, relativePath);
        
        if (!Files.exists(mediaPath)) {
            logger.warn("Media file not found: {}", mediaPath);
            return null;
        }
        
        // Check if already indexed
        Optional<PhotoMetadata> existing = photoMetadataRepository.findByFilePath(relativePath);
        if (existing.isPresent()) {
            return existing.get();
        }
        
        // Determine if this is a video or image
        boolean isVideo = videoMetadataExtractor.isVideoFile(relativePath);
        
        PhotoMetadata metadata;
        
        if (isVideo) {
            // Handle video file
            metadata = indexVideoFile(mediaPath, relativePath);
        } else {
            // Handle image file (existing logic)
            metadata = indexImageFile(mediaPath, relativePath);
        }
        
        return metadata != null ? photoMetadataRepository.save(metadata) : null;
    }
    
    /**
     * Index an image file (existing logic extracted to separate method)
     */
    private PhotoMetadata indexImageFile(Path photoPath, String relativePath) {
        LocalDate captureDate = extractPhotoDate(photoPath);
        if (captureDate == null) {
            logger.warn("Could not determine date for: {}", relativePath);
            return null;
        }
        
        String dateSource = determineDateSource(photoPath);
        PhotoMetadata metadata = new PhotoMetadata(relativePath, captureDate, dateSource);
        metadata.setMediaType("IMAGE");
        
        // Generate thumbnail
        try {
            String thumbnailPath = generateThumbnail(photoPath, relativePath);
            metadata.setThumbnailPath(thumbnailPath);
        } catch (Exception e) {
            logger.warn("Could not generate thumbnail for: {}", relativePath, e);
            // Continue without thumbnail - will fall back to full image
        }
        
        // Extract camera model
        try {
            String cameraModel = extractCameraModel(photoPath.toFile());
            metadata.setCameraModel(cameraModel);
        } catch (Exception e) {
            // Camera model is optional
        }
        
        // Get file size
        try {
            metadata.setFileSize(Files.size(photoPath));
        } catch (IOException e) {
            // File size is optional
        }
        
        return metadata;
    }
    
    /**
     * Index a video file (new method for Phase 1)
     */
    private PhotoMetadata indexVideoFile(Path videoPath, String relativePath) {
        // Extract video metadata
        Map<String, Object> videoMeta = videoMetadataExtractor.extractMetadata(videoPath);
        
        LocalDate captureDate = (LocalDate) videoMeta.get("captureDate");
        if (captureDate == null) {
            logger.warn("Could not determine date for video: {}", relativePath);
            return null;
        }
        
        String dateSource = (String) videoMeta.get("dateSource");
        PhotoMetadata metadata = new PhotoMetadata(relativePath, captureDate, dateSource);
        metadata.setMediaType("VIDEO");
        
        // Set video-specific fields
        Integer duration = (Integer) videoMeta.get("duration");
        if (duration != null) {
            metadata.setVideoDuration(duration);
        }
        
        String resolution = (String) videoMeta.get("resolution");
        if (resolution != null) {
            metadata.setVideoResolution(resolution);
        }
        
        // Generate video thumbnail
        try {
            String thumbnailRelativePath = ".thumbnails/" + relativePath + ".jpg";
            Path thumbnailPath = Paths.get(imageFolder, thumbnailRelativePath);
            
            if (videoThumbnailGenerator.generateVideoThumbnail(videoPath, thumbnailPath)) {
                metadata.setThumbnailPath(thumbnailRelativePath);
            }
        } catch (Exception e) {
            logger.warn("Could not generate video thumbnail for: {}", relativePath, e);
            // Continue without thumbnail
        }
        
        // Get file size
        Long fileSize = (Long) videoMeta.get("fileSize");
        if (fileSize != null) {
            metadata.setFileSize(fileSize);
        }
        
        logger.info("Indexed video: {} ({}s, {})", relativePath, duration, resolution);
        
        return metadata;
    }
    
    /**
     * Index all photos in the image folder (background job)
     */
    public Map<String, Object> indexAllPhotos() {
        long startTime = System.currentTimeMillis();
        int indexed = 0;
        int skipped = 0;
        int errors = 0;
        
        try (Stream<Path> paths = Files.walk(Paths.get(imageFolder))) {
            List<Path> imageFiles = paths
                .filter(Files::isRegularFile)
                .filter(this::isImageFile)
                .collect(Collectors.toList());
            
            logger.info("Found {} image files to index", imageFiles.size());
            
            for (Path imagePath : imageFiles) {
                try {
                    String relativePath = Paths.get(imageFolder).relativize(imagePath)
                        .toString()
                        .replace("\\", "/");
                    
                    if (photoMetadataRepository.existsByFilePath(relativePath)) {
                        skipped++;
                        continue;
                    }
                    
                    PhotoMetadata metadata = indexPhoto(relativePath);
                    if (metadata != null) {
                        indexed++;
                    } else {
                        errors++;
                    }
                    
                } catch (Exception e) {
                    logger.error("Error indexing photo: {}", imagePath, e);
                    errors++;
                }
            }
            
        } catch (IOException e) {
            logger.error("Error walking directory", e);
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        Map<String, Object> result = new HashMap<>();
        result.put("indexed", indexed);
        result.put("skipped", skipped);
        result.put("errors", errors);
        result.put("duration_ms", duration);
        result.put("total_in_db", photoMetadataRepository.count());
        
        logger.info("Indexing complete: {} indexed, {} skipped, {} errors in {}ms", 
            indexed, skipped, errors, duration);
        
        return result;
    }
    
    /**
     * Extract photo date using EXIF or file attributes
     */
    private LocalDate extractPhotoDate(Path filePath) {
        // Try EXIF first
        LocalDate exifDate = getExifDate(filePath.toFile());
        if (exifDate != null) {
            return exifDate;
        }
        
        // Fallback to file creation time
        try {
            FileTime creationTime = (FileTime) Files.getAttribute(filePath, "creationTime");
            return creationTime.toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
        } catch (IOException e) {
            // Last resort - modified time
            try {
                FileTime modifiedTime = Files.getLastModifiedTime(filePath);
                return modifiedTime.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
            } catch (IOException ex) {
                return null;
            }
        }
    }
    
    /**
     * Extract date from EXIF metadata
     */
    private LocalDate getExifDate(File imageFile) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(imageFile);
            ExifSubIFDDirectory directory = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            
            if (directory != null && directory.containsTag(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL)) {
                Date date = directory.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL);
                if (date != null) {
                    return date.toInstant()
                        .atZone(ZoneId.systemDefault())
                        .toLocalDate();
                }
            }
        } catch (Exception e) {
            // EXIF not available
        }
        return null;
    }
    
    /**
     * Extract camera model from EXIF
     */
    private String extractCameraModel(File imageFile) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(imageFile);
            ExifIFD0Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            
            if (directory != null) {
                String make = directory.getString(ExifIFD0Directory.TAG_MAKE);
                String model = directory.getString(ExifIFD0Directory.TAG_MODEL);
                
                if (make != null && model != null) {
                    return make + " " + model;
                } else if (model != null) {
                    return model;
                }
            }
        } catch (Exception e) {
            // Camera model not available
        }
        return null;
    }
    
    /**
     * Determine the source of the date
     */
    private String determineDateSource(Path filePath) {
        LocalDate exifDate = getExifDate(filePath.toFile());
        if (exifDate != null) {
            return "EXIF";
        }
        
        try {
            Files.getAttribute(filePath, "creationTime");
            return "FILE_CREATION";
        } catch (IOException e) {
            return "FILE_MODIFIED";
        }
    }
    
    /**
     * Check if file is an image
     */
    private boolean isImageFile(Path path) {
        String filename = path.getFileName().toString().toLowerCase();
        // Skip Mac metadata files
        if (filename.startsWith("._")) {
            return false;
        }
        // Accept both images and videos
        return filename.matches(".*\\.(png|jpg|jpeg|gif|webp|mp4|mov|avi|mkv|webm|m4v|wmv)$");
    }
    
    /**
     * Convert PhotoMetadata to map for API response
     */
    private Map<String, Object> toMemoryMap(PhotoMetadata metadata) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", metadata.getId());
        map.put("filePath", metadata.getFilePath());
        map.put("thumbnailPath", metadata.getThumbnailPath());
        map.put("captureDate", metadata.getCaptureDate().toString());
        map.put("year", metadata.getYear());
        map.put("dateSource", metadata.getDateSource());
        map.put("cameraModel", metadata.getCameraModel());
        
        // Add video-specific fields
        map.put("mediaType", metadata.getMediaType());
        map.put("isVideo", metadata.isVideo());
        if (metadata.isVideo()) {
            map.put("videoDuration", metadata.getVideoDuration());
            map.put("videoResolution", metadata.getVideoResolution());
        }
        
        // Calculate years ago
        int yearsAgo = LocalDate.now().getYear() - metadata.getYear();
        map.put("yearsAgo", yearsAgo);
        
        return map;
    }
    
    /**
     * Generate thumbnail for an image
     * Returns relative path to thumbnail
     */
    private String generateThumbnail(Path originalPath, String relativePath) throws IOException {
        // Create thumbnails directory if it doesn't exist
        Path thumbnailsDir = Paths.get(imageFolder, ".thumbnails");
        if (!Files.exists(thumbnailsDir)) {
            Files.createDirectories(thumbnailsDir);
            logger.info("Created thumbnails directory: {}", thumbnailsDir);
        }
        
        // Create thumbnail path maintaining folder structure
        String thumbnailRelativePath = ".thumbnails/" + relativePath;
        Path thumbnailPath = Paths.get(imageFolder, thumbnailRelativePath);
        
        // Create parent directories if needed
        Path thumbnailParent = thumbnailPath.getParent();
        if (thumbnailParent != null && !Files.exists(thumbnailParent)) {
            Files.createDirectories(thumbnailParent);
        }
        
        // Skip if thumbnail already exists and is newer than original
        if (Files.exists(thumbnailPath)) {
            long originalModified = Files.getLastModifiedTime(originalPath).toMillis();
            long thumbnailModified = Files.getLastModifiedTime(thumbnailPath).toMillis();
            if (thumbnailModified >= originalModified) {
                return thumbnailRelativePath;
            }
        }
        
        // Read original image
        BufferedImage originalImage = ImageIO.read(originalPath.toFile());
        if (originalImage == null) {
            throw new IOException("Could not read image: " + originalPath);
        }
        
        // Calculate thumbnail dimensions maintaining aspect ratio
        int originalWidth = originalImage.getWidth();
        int originalHeight = originalImage.getHeight();
        int newWidth, newHeight;
        
        if (originalWidth > originalHeight) {
            newWidth = thumbnailSize;
            newHeight = (int) ((double) originalHeight / originalWidth * thumbnailSize);
        } else {
            newHeight = thumbnailSize;
            newWidth = (int) ((double) originalWidth / originalHeight * thumbnailSize);
        }
        
        // Create thumbnail with high-quality scaling
        BufferedImage thumbnail = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = thumbnail.createGraphics();
        
        // Enable high-quality rendering
        g2d.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g2d.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        
        g2d.drawImage(originalImage, 0, 0, newWidth, newHeight, null);
        g2d.dispose();
        
        // Write thumbnail as JPEG with specified quality
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
        if (!writers.hasNext()) {
            throw new IOException("No JPEG writer found");
        }
        
        ImageWriter writer = writers.next();
        ImageWriteParam param = writer.getDefaultWriteParam();
        
        if (param.canWriteCompressed()) {
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(thumbnailQuality / 100f);
        }
        
        try (ImageOutputStream output = ImageIO.createImageOutputStream(thumbnailPath.toFile())) {
            writer.setOutput(output);
            writer.write(null, new javax.imageio.IIOImage(thumbnail, null, null), param);
        } finally {
            writer.dispose();
        }
        
        logger.debug("Generated thumbnail: {} -> {} ({}x{})", relativePath, thumbnailRelativePath, newWidth, newHeight);
        
        return thumbnailRelativePath;
    }
}
