package au.com.siac.gallery.notification.aws;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.ProfileCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.auth.StsAssumeRoleCredentialsProvider;
import software.amazon.awssdk.services.sts.model.AssumeRoleRequest;

/**
 * AWS SNS Service
 * Wrapper for AWS SNS operations with support for AssumeRole
 * Only attempts to use AWS if configured
 */
@Service
public class AwsSnsService {
    
    @Autowired
    private AwsConfigChecker awsConfigChecker;
    
    @Value("${aws.sns.email.topic.arn:}")
    private String emailTopicArn;
    
    @Value("${aws.sns.region:ap-southeast-2}")
    private String awsRegion;

    @Value("${aws.sns.role.arn:${AWS_ROLE_ARN:}}")
    private String roleArn;

    @Value("${aws.sns.role.session.name:${AWS_ROLE_SESSION_NAME:gallery-notification-session}}")
    private String roleSessionName;
    
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
                AwsCredentialsProvider credentialsProvider;
                
                // If role ARN is configured, use AssumeRole
                if (roleArn != null && !roleArn.trim().isEmpty()) {
                    System.out.println("[AwsSnsService] Using AssumeRole with role: " + roleArn);
                    
                    // Create STS client with default credentials (your IAM user)
                    StsClient stsClient = StsClient.builder()
                        .region(Region.of(awsRegion))
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build();
                    
                    // Create AssumeRole request
                    AssumeRoleRequest assumeRoleRequest = AssumeRoleRequest.builder()
                        .roleArn(roleArn)
                        .roleSessionName(roleSessionName)
                        .durationSeconds(3600) // 1 hour
                        .build();
                    
                    // Create credentials provider that assumes the role
                    credentialsProvider = StsAssumeRoleCredentialsProvider.builder()
                        .stsClient(stsClient)
                        .refreshRequest(assumeRoleRequest)
                        .build();
                    
                } else {
                    System.out.println("[AwsSnsService] Using default credentials (no role assumption)");
                    credentialsProvider = DefaultCredentialsProvider.create();
                }
                
                snsClient = SnsClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();
                    
                System.out.println("[AwsSnsService] SNS client created successfully");
                
            } catch (Exception e) {
                System.err.println("[AwsSnsService] Failed to create SNS client: " + e.getMessage());
                e.printStackTrace();
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
        
        if (emailTopicArn == null || emailTopicArn.trim().isEmpty()) {
            System.err.println("[AwsSnsService] Email topic ARN not configured. Set aws.sns.email.topic.arn in application.properties");
            return false;
        }
        
        try {
            // Publish to SNS topic (email subscribers will receive it)
            PublishRequest request = PublishRequest.builder()
                .message(body)
                .subject(subject)
                .topicArn(emailTopicArn)
                .build();
            
            PublishResponse response = client.publish(request);
            System.out.println("[AwsSnsService] ✅ Email sent via AWS SNS. MessageId: " + response.messageId());
            return true;
            
        } catch (Exception e) {
            System.err.println("[AwsSnsService] ❌ Failed to send email: " + e.getMessage());
            e.printStackTrace();
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
            System.out.println("[AwsSnsService] ✅ SMS sent via AWS SNS. MessageId: " + response.messageId());
            return true;
            
        } catch (Exception e) {
            System.err.println("[AwsSnsService] ❌ Failed to send SMS: " + e.getMessage());
            e.printStackTrace();
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
