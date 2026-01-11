package au.com.siac.gallery.notification.aws;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.auth.credentials.AwsCredentialsProvider;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sts.StsClient;
import software.amazon.awssdk.services.sts.auth.StsAssumeRoleCredentialsProvider;
import software.amazon.awssdk.services.sts.model.AssumeRoleRequest;

/**
 * AWS Configuration Checker
 * Checks if AWS credentials are available at startup
 * Application continues to work even if AWS is not configured
 */
@Service
public class AwsConfigChecker {

    @Value("${aws.sns.role.arn:${AWS_ROLE_ARN:}}")
    private String roleArn;

    @Value("${aws.sns.role.session.name:${AWS_ROLE_SESSION_NAME:config-checker-session}}")
    private String roleSessionName;

    @Value("${aws.sns.region:ap-southeast-2}")
    private String awsRegion;

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
            AwsCredentialsProvider credentialsProvider;

            // If role ARN is configured, use AssumeRole
            if (roleArn != null && !roleArn.trim().isEmpty()) {
                System.out.println("   Using AssumeRole with: " + roleArn);

                StsClient stsClient = StsClient.builder()
                        .region(Region.of(awsRegion))
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build();

                AssumeRoleRequest assumeRoleRequest = AssumeRoleRequest.builder()
                        .roleArn(roleArn)
                        .roleSessionName(roleSessionName)
                        .durationSeconds(3600)
                        .build();

                credentialsProvider = StsAssumeRoleCredentialsProvider.builder()
                        .stsClient(stsClient)
                        .refreshRequest(assumeRoleRequest)
                        .build();
            } else {
                System.out.println("   Using default credentials (no role)");
                credentialsProvider = DefaultCredentialsProvider.create();
            }

            // Try to create SNS client
            SnsClient snsClient = SnsClient.builder()
                    .region(Region.of(awsRegion))
                    .credentialsProvider(credentialsProvider)
                    .build();

            // Test connection by listing topics
            snsClient.listTopics();
            snsClient.close();

            awsConfigured = true;
            statusMessage = "AWS SNS is CONFIGURED and accessible";
            System.out.println("✅ " + statusMessage);
            System.out.println("   Region: " + awsRegion);
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
            System.out.println("   2. Set AWS_ROLE_ARN environment variable");
            System.out.println("   3. Restart application");
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