package au.com.siac.gallery.memories.controller;

import au.com.siac.gallery.memories.service.MemoriesService;
import au.com.siac.gallery.memories.service.MemoriesNotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/memories")
public class MemoriesController {
    
    private final MemoriesService memoriesService;
    private final MemoriesNotificationService notificationService;
    
    @Value("${memories.batch-size:12}")
    private int batchSize;
    
    public MemoriesController(MemoriesService memoriesService, 
                             MemoriesNotificationService notificationService) {
        this.memoriesService = memoriesService;
        this.notificationService = notificationService;
    }
    
    /**
     * Get memories configuration
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        Map<String, Object> response = new HashMap<>();
        response.put("batchSize", batchSize);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get memories for today
     */
    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> getTodaysMemories() {
        List<Map<String, Object>> memories = memoriesService.getTodaysMemories();
        long count = memoriesService.getTodaysMemoryCount();
        
        Map<String, Object> response = new HashMap<>();
        response.put("count", count);
        response.put("memories", memories);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get memories for a specific date
     */
    @GetMapping("/date/{month}/{day}")
    public ResponseEntity<Map<String, Object>> getMemoriesForDate(
            @PathVariable int month, 
            @PathVariable int day) {
        List<Map<String, Object>> memories = memoriesService.getMemoriesForDate(month, day);
        
        Map<String, Object> response = new HashMap<>();
        response.put("count", memories.size());
        response.put("memories", memories);
        response.put("month", month);
        response.put("day", day);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Index all photos (admin endpoint)
     */
    @PostMapping("/index")
    public ResponseEntity<Map<String, Object>> indexPhotos() {
        Map<String, Object> result = memoriesService.indexAllPhotos();
        return ResponseEntity.ok(result);
    }
    
    /**
     * Get count of memories for today
     */
    @GetMapping("/today/count")
    public ResponseEntity<Map<String, Object>> getTodaysMemoryCount() {
        long count = memoriesService.getTodaysMemoryCount();
        
        Map<String, Object> response = new HashMap<>();
        response.put("count", count);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get memory counts for calendar month
     * Returns map of day -> count for the specified month
     */
    @GetMapping("/calendar/{year}/{month}")
    public ResponseEntity<Map<String, Object>> getCalendarMemoryCounts(
            @PathVariable int year,
            @PathVariable int month) {
        Map<Integer, Long> counts = memoriesService.getMemoryCountsForMonth(month);
        
        Map<String, Object> response = new HashMap<>();
        response.put("year", year);
        response.put("month", month);
        response.put("counts", counts);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Get pending memories notification
     */
    @GetMapping("/notification/pending")
    public ResponseEntity<Map<String, Object>> getPendingNotification() {
        MemoriesNotificationService.MemoriesNotificationDTO notification = 
            notificationService.getPendingNotification();
        
        Map<String, Object> response = new HashMap<>();
        if (notification != null) {
            response.put("hasPending", true);
            response.put("count", notification.getCount());
            response.put("message", notification.getMessage());
        } else {
            response.put("hasPending", false);
        }
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Mark notification as shown
     */
    @PostMapping("/notification/shown")
    public ResponseEntity<Map<String, Object>> markNotificationShown() {
        notificationService.markNotificationShown();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        
        return ResponseEntity.ok(response);
    }
}
