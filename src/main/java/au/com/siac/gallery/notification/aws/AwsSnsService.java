package au.com.siac.gallery.notification.aws;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;

/**
 * AWS SNS Service
 * Wrapper for AWS SNS operations
 * Only attempts to use AWS if configured
 */
@Service
public class AwsSnsService {
    
    @Autowired
    private AwsConfigChecker awsConfigChecker;
    
    private SnsClient snsClient;
    
    /**
     * Get or create SNS client
     * Returns null if AWS not configured
     */
    private SnsClient getSnsClient() {
        if (!awsConfigChecker.isAwsConfigured()) {
            return null;
        }
        
        if (snsClient == null) {
            try {
                snsClient = SnsClient.builder()
                    .region(Region.AP_SOUTHEAST_2) // Sydney
                    .credentialsProvider(DefaultCredentialsProvider.create())
                    .build();
            } catch (Exception e) {
                System.err.println("[AwsSnsService] Failed to create SNS client: " + e.getMessage());
                return null;
            }
        }
        
        return snsClient;
    }
    
    /**
     * Send email via AWS SNS
     * Returns true if sent successfully, false otherwise
     */
    public boolean sendEmail(String toEmail, String subject, String body) {
        SnsClient client = getSnsClient();
        if (client == null) {
            return false; // AWS not configured
        }
        
        try {
            // For email, we need to use SNS with email subscription
            // This is a simplified version - in production you'd use SES or configured SNS topics
            PublishRequest request = PublishRequest.builder()
                .message(body)
                .subject(subject)
                .topicArn("arn:aws:sns:ap-southeast-2:YOUR_ACCOUNT:YOUR_TOPIC") // Would be configured
                .build();
            
            PublishResponse response = client.publish(request);
            System.out.println("[AwsSnsService] Email sent via AWS SNS. MessageId: " + response.messageId());
            return true;
            
        } catch (Exception e) {
            System.err.println("[AwsSnsService] Failed to send email: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Send SMS via AWS SNS
     * Returns true if sent successfully, false otherwise
     */
    public boolean sendSms(String phoneNumber, String message) {
        SnsClient client = getSnsClient();
        if (client == null) {
            return false; // AWS not configured
        }
        
        try {
            PublishRequest request = PublishRequest.builder()
                .message(message)
                .phoneNumber(phoneNumber) // Must be in E.164 format: +61412345678
                .build();
            
            PublishResponse response = client.publish(request);
            System.out.println("[AwsSnsService] SMS sent via AWS SNS. MessageId: " + response.messageId());
            return true;
            
        } catch (Exception e) {
            System.err.println("[AwsSnsService] Failed to send SMS: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Check if AWS SNS is available
     */
    public boolean isAvailable() {
        return awsConfigChecker.isAwsConfigured();
    }
}
