package au.com.siac.gallery.weather.controller;

import au.com.siac.gallery.weather.entity.WeatherLocation;
import au.com.siac.gallery.weather.service.WeatherLocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/locations")
public class WeatherLocationController {
    
    @Autowired
    private WeatherLocationService locationService;
    
    /**
     * Get all saved weather locations
     * GET /api/locations
     */
    @GetMapping
    public ResponseEntity<List<WeatherLocation>> getAllLocations() {
        try {
            List<WeatherLocation> locations = locationService.getAllLocations();
            return ResponseEntity.ok(locations);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Get location by ID
     * GET /api/locations/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getLocationById(@PathVariable Long id) {
        try {
            return locationService.getLocationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Get default location
     * GET /api/locations/default
     */
    @GetMapping("/default")
    public ResponseEntity<?> getDefaultLocation() {
        try {
            return locationService.getDefaultLocation()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Create new location
     * POST /api/locations
     * Body: { "locationName": "Sydney, NSW", "latitude": -33.8688, "longitude": 151.2093, "isDefault": false }
     */
    @PostMapping
    public ResponseEntity<?> createLocation(@RequestBody WeatherLocation location) {
        try {
            WeatherLocation created = locationService.createLocation(location);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Update existing location
     * PUT /api/locations/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateLocation(@PathVariable Long id, @RequestBody WeatherLocation location) {
        try {
            WeatherLocation updated = locationService.updateLocation(id, location);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Delete location
     * DELETE /api/locations/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLocation(@PathVariable Long id) {
        try {
            locationService.deleteLocation(id);
            return ResponseEntity.ok(Map.of("message", "Location deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Set location as default
     * POST /api/locations/{id}/default
     */
    @PostMapping("/{id}/default")
    public ResponseEntity<?> setAsDefault(@PathVariable Long id) {
        try {
            WeatherLocation updated = locationService.setAsDefault(id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Reorder locations
     * POST /api/locations/reorder
     * Body: { "orderedIds": [2, 1, 3] }
     */
    @PostMapping("/reorder")
    public ResponseEntity<?> reorderLocations(@RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> orderedIds = request.get("orderedIds");
            locationService.reorderLocations(orderedIds);
            return ResponseEntity.ok(Map.of("message", "Locations reordered successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Search for location by name (geocoding)
     * This uses Open-Meteo's geocoding API
     * GET /api/locations/search?q=Sydney
     */
    @GetMapping("/search")
    public ResponseEntity<?> searchLocation(@RequestParam String q) {
        try {
            // Use Open-Meteo Geocoding API (free, no API key needed)
            String url = "https://geocoding-api.open-meteo.com/v1/search?name=" + 
                java.net.URLEncoder.encode(q, "UTF-8") + "&count=10&language=en&format=json";
            
            org.springframework.web.client.RestTemplate restTemplate = 
                new org.springframework.web.client.RestTemplate();
            
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to search location: " + e.getMessage()));
        }
    }
}
