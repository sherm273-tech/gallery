package au.com.siac.gallery.notification.provider;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.notification.aws.AwsSnsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * SMS notification provider using AWS SNS
 * Falls back to stub mode if AWS not configured
 */
@Component
public class SmsNotificationProvider {
    
    @Autowired
    private AwsSnsService awsSnsService;
    
    /**
     * Send SMS notification via AWS SNS
     * Falls back to stub if AWS not available
     */
    public boolean sendNotification(Event event, String timing, String recipient) {
        try {
            String message = formatMessage(event, timing);
            return sendSms(recipient, message);
            
        } catch (Exception e) {
            System.err.println("[SmsNotificationProvider] Error sending SMS: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Send a simple SMS (for testing or direct sending)
     */
    public boolean sendSms(String recipient, String message) {
        try {
            // Try AWS SNS first if configured
            if (awsSnsService.isAvailable()) {
                System.out.println("[SmsNotificationProvider] Sending via AWS SNS...");
                boolean sent = awsSnsService.sendSms(recipient, message);
                
                if (sent) {
                    System.out.println("[SmsNotificationProvider] ✅ SMS sent via AWS SNS to: " + recipient);
                    System.out.println("  Cost: ~$0.08 AUD");
                    return true;
                } else {
                    System.err.println("[SmsNotificationProvider] ❌ AWS SNS failed, SMS not sent");
                    return false;
                }
            } else {
                // Fallback to stub mode
                System.out.println("[SmsNotificationProvider] ⚠️  STUB MODE - AWS not configured");
                System.out.println("  To: " + recipient);
                System.out.println("  Message: " + message);
                System.out.println("  Would cost: ~$0.08 AUD");
                return true; // Return success in stub mode
            }
            
        } catch (Exception e) {
            System.err.println("[SmsNotificationProvider] Error sending SMS: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Format SMS message (keep under 160 characters if possible)
     */
    private String formatMessage(Event event, String timing) {
        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("MMM d");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("h:mm a");
        
        LocalDateTime eventDateTime = event.getEventStartDatetime();
        String dateStr = eventDateTime.format(dateFormat);
        String timeStr = eventDateTime.format(timeFormat);
        
        StringBuilder message = new StringBuilder();
        message.append("Reminder: ").append(event.getTitle());
        message.append(" - ");
        message.append(dateStr).append(" at ").append(timeStr);
        message.append(" (").append(formatTiming(timing)).append(")");
        
        // Truncate if too long (SMS limit is 160 chars)
        String result = message.toString();
        if (result.length() > 160) {
            result = result.substring(0, 157) + "...";
        }
        
        return result;
    }
    
    /**
     * Convert timing code to readable text
     */
    private String formatTiming(String timing) {
        switch (timing) {
            case "1_week_before": return "in 1 week";
            case "3_days_before": return "in 3 days";
            case "1_day_before": return "tomorrow";
            case "morning_of": return "today";
            case "1_hour_before": return "in 1 hour";
            case "30_mins_before": return "in 30 mins";
            default: return "soon";
        }
    }
}
