package au.com.siac.gallery.notification.provider;

import au.com.siac.gallery.events.entity.Event;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

/**
 * Email notification provider using AWS SNS
 * Currently a stub - will be implemented with actual AWS SNS integration
 */
@Component
public class EmailNotificationProvider {
    
    /**
     * Send email notification via AWS SNS
     * TODO: Implement actual AWS SNS email sending
     */
    public boolean sendNotification(Event event, String timing, String recipient) {
        try {
            String subject = formatSubject(event, timing);
            String body = formatBody(event, timing);
            
            System.out.println("[EmailNotificationProvider] STUB - Would send email:");
            System.out.println("  To: " + recipient);
            System.out.println("  Subject: " + subject);
            System.out.println("  Body: " + body);
            
            // TODO: Implement AWS SNS email sending
            // SnsClient snsClient = SnsClient.builder()...
            // PublishRequest request = PublishRequest.builder()...
            
            // For now, just log and return success
            return true;
            
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
        String dateStr = event.getEventDate().format(dateFormat);
        
        StringBuilder body = new StringBuilder();
        body.append("Hello,\n\n");
        body.append("This is a reminder about your upcoming event:\n\n");
        body.append("Event: ").append(event.getTitle()).append("\n");
        body.append("Date: ").append(dateStr);
        
        if (event.getEventTime() != null) {
            body.append(" at ").append(event.getEventTime());
        }
        body.append("\n");
        
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
