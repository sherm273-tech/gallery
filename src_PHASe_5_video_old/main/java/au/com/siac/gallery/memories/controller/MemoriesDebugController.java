package au.com.siac.gallery.memories.controller;

import au.com.siac.gallery.memories.entity.PhotoMetadata;
import au.com.siac.gallery.memories.repository.PhotoMetadataRepository;
import au.com.siac.gallery.memories.service.MemoriesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Debug controller for troubleshooting memories feature
 * Access at: http://localhost:8080/api/memories/debug
 */
@RestController
@RequestMapping("/api/memories/debug")
public class MemoriesDebugController {
    
    @Autowired
    private PhotoMetadataRepository photoMetadataRepository;
    
    @Autowired
    private MemoriesService memoriesService;
    
    /**
     * Get debug info about the memories system
     */
    @GetMapping
    public Map<String, Object> getDebugInfo() {
        Map<String, Object> debug = new HashMap<>();
        
        // Total photos indexed
        long totalPhotos = photoMetadataRepository.count();
        debug.put("total_photos_indexed", totalPhotos);
        
        // Today's date info
        LocalDate today = LocalDate.now();
        debug.put("today", today.toString());
        debug.put("today_month", today.getMonthValue());
        debug.put("today_day", today.getDayOfMonth());
        
        // Memories for today
        long todayCount = memoriesService.getTodaysMemoryCount();
        debug.put("memories_today_count", todayCount);
        
        // Memory counts for current month
        Map<Integer, Long> monthCounts = memoriesService.getMemoryCountsForMonth(today.getMonthValue());
        debug.put("current_month_memory_counts", monthCounts);
        debug.put("days_with_memories_this_month", monthCounts.size());
        
        // Sample of all photos (first 10)
        List<PhotoMetadata> samplePhotos = photoMetadataRepository.findAll().stream()
            .limit(10)
            .collect(Collectors.toList());
        
        List<Map<String, Object>> samples = samplePhotos.stream()
            .map(p -> {
                Map<String, Object> photo = new HashMap<>();
                photo.put("id", p.getId());
                photo.put("file_path", p.getFilePath());
                photo.put("capture_date", p.getCaptureDate());
                photo.put("year", p.getYear());
                photo.put("month", p.getMonth());
                photo.put("day", p.getDay());
                photo.put("date_source", p.getDateSource());
                photo.put("camera_model", p.getCameraModel());
                return photo;
            })
            .collect(Collectors.toList());
        
        debug.put("sample_photos", samples);
        
        // Distribution by month
        Map<Integer, Long> monthDistribution = new HashMap<>();
        for (int month = 1; month <= 12; month++) {
            long count = 0;
            for (int day = 1; day <= 31; day++) {
                count += photoMetadataRepository.countByMonthAndDay(month, day);
            }
            if (count > 0) {
                monthDistribution.put(month, count);
            }
        }
        debug.put("photos_by_month", monthDistribution);
        
        // Date source breakdown
        Map<String, Long> bySource = new HashMap<>();
        List<PhotoMetadata> allPhotos = photoMetadataRepository.findAll();
        bySource.put("EXIF", allPhotos.stream().filter(p -> "EXIF".equals(p.getDateSource())).count());
        bySource.put("FILE_CREATION", allPhotos.stream().filter(p -> "FILE_CREATION".equals(p.getDateSource())).count());
        bySource.put("FILE_MODIFIED", allPhotos.stream().filter(p -> "FILE_MODIFIED".equals(p.getDateSource())).count());
        debug.put("photos_by_source", bySource);
        
        return debug;
    }
    
    /**
     * Get all photos for a specific month/day
     */
    @GetMapping("/date")
    public Map<String, Object> getPhotosForDate(int month, int day) {
        List<PhotoMetadata> photos = photoMetadataRepository.findByMonthAndDay(month, day);
        
        Map<String, Object> result = new HashMap<>();
        result.put("month", month);
        result.put("day", day);
        result.put("count", photos.size());
        
        List<Map<String, Object>> photoList = photos.stream()
            .map(p -> {
                Map<String, Object> photo = new HashMap<>();
                photo.put("year", p.getYear());
                photo.put("file_path", p.getFilePath());
                photo.put("capture_date", p.getCaptureDate());
                photo.put("date_source", p.getDateSource());
                return photo;
            })
            .collect(Collectors.toList());
        
        result.put("photos", photoList);
        
        return result;
    }
    
    /**
     * Get calendar data for current month (what the frontend should be getting)
     */
    @GetMapping("/calendar-data")
    public Map<String, Object> getCalendarData() {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        int month = today.getMonthValue();
        
        Map<Integer, Long> counts = memoriesService.getMemoryCountsForMonth(month);
        
        Map<String, Object> response = new HashMap<>();
        response.put("year", year);
        response.put("month", month);
        response.put("counts", counts);
        response.put("total_days_with_memories", counts.size());
        
        // Add details for each day with memories
        Map<Integer, List<Integer>> dayDetails = new HashMap<>();
        counts.forEach((day, count) -> {
            List<PhotoMetadata> photos = photoMetadataRepository.findByMonthAndDay(month, day);
            List<Integer> years = photos.stream()
                .map(PhotoMetadata::getYear)
                .distinct()
                .sorted()
                .collect(Collectors.toList());
            dayDetails.put(day, years);
        });
        response.put("years_by_day", dayDetails);
        
        return response;
    }
    
    /**
     * Test if a specific date has memories
     */
    @GetMapping("/test-date")
    public Map<String, Object> testDate(int month, int day) {
        long count = photoMetadataRepository.countByMonthAndDay(month, day);
        List<PhotoMetadata> photos = photoMetadataRepository.findByMonthAndDay(month, day);
        
        Map<String, Object> result = new HashMap<>();
        result.put("month", month);
        result.put("day", day);
        result.put("has_memories", count > 0);
        result.put("count", count);
        result.put("years", photos.stream().map(PhotoMetadata::getYear).distinct().sorted().collect(Collectors.toList()));
        
        return result;
    }
    
    /**
     * Manually trigger full indexing of all photos and videos
     * POST /api/memories/debug/index
     */
    @GetMapping("/index")
    public Map<String, Object> indexAllPhotos() {
        return memoriesService.indexAllPhotos();
    }
}
