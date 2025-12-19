package au.com.siac.gallery.notification.repository;

import au.com.siac.gallery.notification.entity.NotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationSettingsRepository extends JpaRepository<NotificationSettings, Long> {
    
    /**
     * Find the first (and should be only) settings record
     * Since this is a singleton, there should only be one record
     */
    Optional<NotificationSettings> findFirstBy();
}
