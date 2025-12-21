package au.com.siac.gallery.notification.provider;

import au.com.siac.gallery.events.entity.Event;
import au.com.siac.gallery.notification.aws.AwsSnsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Email notification provider using AWS SNS
 * Falls back to stub mode if AWS not configured
 */
@Component
public class EmailNotificationProvider {
    
    @Autowired
    private AwsSnsService awsSnsService;
    
    /**
     * Send email notification via AWS SNS
     */
    public boolean sendNotification(Event event, String timing, String recipient) {
        try {
            String subject = formatSubject(event, timing);
            String body = formatBody(event, timing);
            
            return sendEmail(recipient, subject, body);
            
        } catch (Exception e) {
            System.err.println("[EmailNotificationProvider] Error sending email: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Send a simple email (for testing or direct sending)
     */
    public boolean sendEmail(String recipient, String subject, String body) {
        try {
            // Try AWS SNS first if configured
            if (awsSnsService.isAvailable()) {
                System.out.println("[EmailNotificationProvider] Sending via AWS SNS...");
                boolean sent = awsSnsService.sendEmail(recipient, subject, body);
                
                if (sent) {
                    System.out.println("[EmailNotificationProvider] ✅ Email sent via AWS SNS to: " + recipient);
                    return true;
                } else {
                    System.err.println("[EmailNotificationProvider] ❌ AWS SNS failed, email not sent");
                    return false;
                }
            } else {
                // Fallback to stub mode
                System.out.println("[EmailNotificationProvider] ⚠️  STUB MODE - AWS not configured");
                System.out.println("  To: " + recipient);
                System.out.println("  Subject: " + subject);
                System.out.println("  Body: " + body);
                return true; // Return success in stub mode
            }
            
        } catch (Exception e) {
            System.err.println("[EmailNotificationProvider] Error sending email: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Format email subject
     */
    private String formatSubject(Event event, String timing) {
        String when = formatTiming(timing);
        return "Reminder: " + event.getTitle() + " - " + when;
    }
    
    /**
     * Format email body
     */
    private String formatBody(Event event, String timing) {
        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy");
        DateTimeFormatter timeFormat = DateTimeFormatter.ofPattern("h:mm a");
        
        LocalDateTime eventDateTime = event.getEventStartDatetime();
        String dateStr = eventDateTime.format(dateFormat);
        String timeStr = eventDateTime.format(timeFormat);
        
        StringBuilder body = new StringBuilder();
        body.append("Hello,\n\n");
        body.append("This is a reminder about your upcoming event:\n\n");
        body.append("Event: ").append(event.getTitle()).append("\n");
        body.append("Date: ").append(dateStr).append(" at ").append(timeStr).append("\n");
        
        if (event.getDescription() != null && !event.getDescription().isEmpty()) {
            body.append("Details: ").append(event.getDescription()).append("\n");
        }
        
        body.append("\nReminder: ").append(formatTiming(timing)).append("\n");
        body.append("\n---\n");
        body.append("Sent from Sang's and Sherm's Station");
        
        return body.toString();
    }
    
    /**
     * Convert timing code to readable text
     */
    private String formatTiming(String timing) {
        switch (timing) {
            case "1_week_before": return "1 week before";
            case "3_days_before": return "3 days before";
            case "1_day_before": return "1 day before";
            case "morning_of": return "day of event";
            case "1_hour_before": return "1 hour before";
            case "30_mins_before": return "30 minutes before";
            default: return "upcoming";
        }
    }
}
