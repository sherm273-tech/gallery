package au.com.siac.gallery.notification.aws;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Startup listener to check AWS configuration
 * Runs after application is fully started
 */
@Component
public class AwsStartupChecker {
    
    @Autowired
    private AwsConfigChecker awsConfigChecker;
    
    /**
     * Check AWS configuration after application starts
     */
    @EventListener(ApplicationReadyEvent.class)
    public void checkAwsOnStartup() {
        // Small delay to let other components finish starting
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            // Ignore
        }
        
        awsConfigChecker.checkAwsConfiguration();
    }
}
