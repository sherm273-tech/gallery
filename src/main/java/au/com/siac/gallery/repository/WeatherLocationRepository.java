package au.com.siac.gallery.repository;

import au.com.siac.gallery.entity.WeatherLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeatherLocationRepository extends JpaRepository<WeatherLocation, Long> {
    
    /**
     * Find all locations ordered by display order
     */
    List<WeatherLocation> findAllByOrderByDisplayOrderAsc();
    
    /**
     * Find the default location
     */
    Optional<WeatherLocation> findByIsDefaultTrue();
    
    /**
     * Count total locations
     */
    long count();
}
