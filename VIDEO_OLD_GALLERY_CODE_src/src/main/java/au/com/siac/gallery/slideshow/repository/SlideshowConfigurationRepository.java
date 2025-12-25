package au.com.siac.gallery.slideshow.repository;

import au.com.siac.gallery.slideshow.entity.SlideshowConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SlideshowConfigurationRepository extends JpaRepository<SlideshowConfiguration, Long> {
    
    Optional<SlideshowConfiguration> findByEventId(Long eventId);
    
    void deleteByEventId(Long eventId);
    
    boolean existsByEventId(Long eventId);
}
