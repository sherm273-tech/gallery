package au.com.siac.gallery.notification.service;

import au.com.siac.gallery.notification.entity.NotificationSettings;
import au.com.siac.gallery.notification.repository.NotificationSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalTime;

/**
 * Service for managing global notification settings
 * Implements singleton pattern - only one settings record should exist
 */
@Service
public class NotificationSettingsService {
    
    @Autowired
    private NotificationSettingsRepository settingsRepository;
    
    /**
     * Get the current notification settings
     * Creates default settings if none exist
     */
    public NotificationSettings getSettings() {
        return settingsRepository.findFirstBy()
            .orElseGet(this::createDefaultSettings);
    }
    
    /**
     * Update notification settings
     */
    public NotificationSettings updateSettings(NotificationSettings settings) {
        NotificationSettings existing = getSettings();
        
        // Update fields
        existing.setDefaultEmail(settings.getDefaultEmail());
        existing.setDefaultPhone(settings.getDefaultPhone());
        existing.setDefaultBrowserEnabled(settings.getDefaultBrowserEnabled());
        existing.setDefaultEmailEnabled(settings.getDefaultEmailEnabled());
        existing.setDefaultSmsEnabled(settings.getDefaultSmsEnabled());
        existing.setQuietHoursEnabled(settings.getQuietHoursEnabled());
        existing.setQuietHoursStart(settings.getQuietHoursStart());
        existing.setQuietHoursEnd(settings.getQuietHoursEnd());
        existing.setAwsSnsRegion(settings.getAwsSnsRegion());
        
        return settingsRepository.save(existing);
    }
    
    /**
     * Check if currently within quiet hours
     */
    public boolean isQuietHours() {
        NotificationSettings settings = getSettings();
        
        if (!settings.getQuietHoursEnabled()) {
            return false;
        }
        
        LocalTime now = LocalTime.now();
        LocalTime start = settings.getQuietHoursStart();
        LocalTime end = settings.getQuietHoursEnd();
        
        if (start == null || end == null) {
            return false;
        }
        
        // Handle quiet hours that span midnight (e.g., 22:00 to 07:00)
        if (start.isBefore(end)) {
            // Normal case: quiet hours don't span midnight
            return now.isAfter(start) && now.isBefore(end);
        } else {
            // Spans midnight: quiet from start to midnight OR midnight to end
            return now.isAfter(start) || now.isBefore(end);
        }
    }
    
    /**
     * Create default settings
     */
    private NotificationSettings createDefaultSettings() {
        NotificationSettings settings = new NotificationSettings();
        settings.setDefaultBrowserEnabled(true);
        settings.setDefaultEmailEnabled(false);
        settings.setDefaultSmsEnabled(false);
        settings.setQuietHoursEnabled(true);
        settings.setQuietHoursStart(LocalTime.of(22, 0));  // 10 PM
        settings.setQuietHoursEnd(LocalTime.of(7, 0));     // 7 AM
        
        return settingsRepository.save(settings);
    }
}
