package au.com.siac.gallery.weather.service;

import au.com.siac.gallery.weather.entity.WeatherLocation;
import au.com.siac.gallery.weather.repository.WeatherLocationRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class WeatherLocationService {
    
    @Autowired
    private WeatherLocationRepository locationRepository;
    
    /**
     * Initialize with default location (Essendon) if database is empty
     */
    @PostConstruct
    public void initializeDefaultLocation() {
        if (locationRepository.count() == 0) {
            WeatherLocation defaultLocation = new WeatherLocation(
                "Essendon, VIC",
                -37.7564,
                144.9066,
                1,
                true
            );
            locationRepository.save(defaultLocation);
            System.out.println("✅ Created default weather location: Essendon, VIC");
        }
    }
    
    /**
     * Get all locations ordered by display order
     */
    public List<WeatherLocation> getAllLocations() {
        return locationRepository.findAllByOrderByDisplayOrderAsc();
    }
    
    /**
     * Get location by ID
     */
    public Optional<WeatherLocation> getLocationById(Long id) {
        return locationRepository.findById(id);
    }
    
    /**
     * Get default location
     */
    public Optional<WeatherLocation> getDefaultLocation() {
        return locationRepository.findByIsDefaultTrue();
    }
    
    /**
     * Create new location
     */
    @Transactional
    public WeatherLocation createLocation(WeatherLocation location) {
        // If this is set as default, unset other defaults
        if (location.getIsDefault() != null && location.getIsDefault()) {
            unsetAllDefaults();
        }
        
        // Set display order to max + 1 if not provided
        if (location.getDisplayOrder() == null) {
            long maxOrder = locationRepository.findAllByOrderByDisplayOrderAsc()
                .stream()
                .mapToInt(WeatherLocation::getDisplayOrder)
                .max()
                .orElse(0);
            location.setDisplayOrder((int) maxOrder + 1);
        }
        
        return locationRepository.save(location);
    }
    
    /**
     * Update existing location
     */
    @Transactional
    public WeatherLocation updateLocation(Long id, WeatherLocation updatedLocation) {
        WeatherLocation existing = locationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Location not found with id: " + id));
        
        existing.setLocationName(updatedLocation.getLocationName());
        existing.setLatitude(updatedLocation.getLatitude());
        existing.setLongitude(updatedLocation.getLongitude());
        existing.setDisplayOrder(updatedLocation.getDisplayOrder());
        
        // If setting as default, unset other defaults
        if (updatedLocation.getIsDefault() != null && updatedLocation.getIsDefault()) {
            unsetAllDefaults();
            existing.setIsDefault(true);
        } else if (updatedLocation.getIsDefault() != null && !updatedLocation.getIsDefault()) {
            existing.setIsDefault(false);
        }
        
        return locationRepository.save(existing);
    }
    
    /**
     * Delete location
     */
    @Transactional
    public void deleteLocation(Long id) {
        WeatherLocation location = locationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Location not found with id: " + id));
        
        // If deleting the default location, set another as default
        if (location.getIsDefault()) {
            List<WeatherLocation> allLocations = locationRepository.findAllByOrderByDisplayOrderAsc();
            if (allLocations.size() > 1) {
                // Set the first non-deleted location as default
                allLocations.stream()
                    .filter(l -> !l.getId().equals(id))
                    .findFirst()
                    .ifPresent(l -> {
                        l.setIsDefault(true);
                        locationRepository.save(l);
                    });
            }
        }
        
        locationRepository.deleteById(id);
    }
    
    /**
     * Set a location as default
     */
    @Transactional
    public WeatherLocation setAsDefault(Long id) {
        WeatherLocation location = locationRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Location not found with id: " + id));
        
        unsetAllDefaults();
        location.setIsDefault(true);
        return locationRepository.save(location);
    }
    
    /**
     * Unset all default flags
     */
    private void unsetAllDefaults() {
        List<WeatherLocation> allLocations = locationRepository.findAll();
        allLocations.forEach(loc -> {
            if (loc.getIsDefault()) {
                loc.setIsDefault(false);
                locationRepository.save(loc);
            }
        });
    }
    
    /**
     * Reorder locations
     */
    @Transactional
    public void reorderLocations(List<Long> orderedIds) {
        for (int i = 0; i < orderedIds.size(); i++) {
            Long id = orderedIds.get(i);
            final int displayOrder = i + 1;  // Make it final for lambda
            locationRepository.findById(id).ifPresent(location -> {
                location.setDisplayOrder(displayOrder);
                locationRepository.save(location);
            });
        }
    }
}
