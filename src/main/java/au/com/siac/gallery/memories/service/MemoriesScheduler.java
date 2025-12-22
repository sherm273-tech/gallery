package au.com.siac.gallery.memories.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Memories Scheduler
 * Handles automatic indexing and notifications for memories
 */
@Service
public class MemoriesScheduler {
    
    private static final Logger logger = LoggerFactory.getLogger(MemoriesScheduler.class);
    
    @Value("${memories.auto-index.enabled:true}")
    private boolean autoIndexEnabled;
    
    @Value("${memories.auto-index.cron:0 0 2 * * *}")
    private String autoIndexCron;
    
    @Autowired
    private MemoriesService memoriesService;
    
    @Autowired
    private MemoriesNotificationService memoriesNotificationService;
    
    /**
     * Automatic daily photo indexing
     * Default: Runs at 2 AM every day
     * Can be disabled with: memories.auto-index.enabled=false
     */
    @Scheduled(cron = "${memories.auto-index.cron:0 0 2 * * *}")
    public void autoIndexPhotos() {
        if (!autoIndexEnabled) {
            logger.debug("[MemoriesScheduler] Auto-indexing disabled, skipping");
            return;
        }
        
        logger.info("[MemoriesScheduler] Starting automatic photo indexing at {}", LocalDateTime.now());
        
        try {
            Map<String, Object> result = memoriesService.indexAllPhotos();
            
            logger.info("[MemoriesScheduler] Auto-indexing complete: {} indexed, {} skipped, {} errors in {}ms",
                result.get("indexed"),
                result.get("skipped"),
                result.get("errors"),
                result.get("duration_ms"));
                
        } catch (Exception e) {
            logger.error("[MemoriesScheduler] Error during auto-indexing", e);
        }
    }
    
    /**
     * Check for memories and send notifications
     * Runs at 9 AM every day
     */
    @Scheduled(cron = "0 0 9 * * *")
    public void checkMemoriesNotification() {
        logger.info("[MemoriesScheduler] Checking for memories to notify at {}", LocalDateTime.now());
        
        try {
            memoriesNotificationService.checkAndSendDailyMemoriesNotification();
        } catch (Exception e) {
            logger.error("[MemoriesScheduler] Error checking memories notification", e);
        }
    }
}
