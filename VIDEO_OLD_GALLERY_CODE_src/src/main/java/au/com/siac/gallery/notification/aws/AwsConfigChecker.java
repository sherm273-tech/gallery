package au.com.siac.gallery.notification.aws;

import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;

/**
 * AWS Configuration Checker
 * Checks if AWS credentials are available at startup
 * Application continues to work even if AWS is not configured
 */
@Service
public class AwsConfigChecker {
    
    private boolean awsConfigured = false;
    private String statusMessage = "Not checked yet";
    
    /**
     * Check if AWS is configured
     * Called on startup and can be called anytime
     */
    public void checkAwsConfiguration() {
        System.out.println("\n========================================");
        System.out.println("AWS SNS CONFIGURATION CHECK");
        System.out.println("========================================");
        
        try {
            // Try to create credentials provider
            DefaultCredentialsProvider credentialsProvider = DefaultCredentialsProvider.create();
            credentialsProvider.resolveCredentials();
            
            // Try to create SNS client
            SnsClient snsClient = SnsClient.builder()
                .region(Region.AP_SOUTHEAST_2) // Sydney region, can be configured
                .credentialsProvider(credentialsProvider)
                .build();
            
            // Test connection by listing topics
            snsClient.listTopics();
            snsClient.close();
            
            awsConfigured = true;
            statusMessage = "AWS SNS is CONFIGURED and accessible";
            System.out.println("✅ " + statusMessage);
            System.out.println("   Region: ap-southeast-2 (Sydney)");
            System.out.println("   Email notifications: ENABLED");
            System.out.println("   SMS notifications: ENABLED");
            
        } catch (Exception e) {
            awsConfigured = false;
            statusMessage = "AWS SNS is NOT configured";
            System.out.println("⚠️  " + statusMessage);
            System.out.println("   Reason: " + e.getMessage());
            System.out.println("   Email notifications: STUB MODE (logs only)");
            System.out.println("   SMS notifications: STUB MODE (logs only)");
            System.out.println("\n   To enable AWS SNS:");
            System.out.println("   1. Set AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)");
            System.out.println("   2. Or configure AWS CLI: aws configure");
            System.out.println("   3. Or set credentials in ~/.aws/credentials");
            System.out.println("   4. Restart application");
        }
        
        System.out.println("========================================\n");
    }
    
    /**
     * Check if AWS is currently configured and working
     */
    public boolean isAwsConfigured() {
        return awsConfigured;
    }
    
    /**
     * Get current AWS configuration status message
     */
    public String getStatusMessage() {
        return statusMessage;
    }
}
