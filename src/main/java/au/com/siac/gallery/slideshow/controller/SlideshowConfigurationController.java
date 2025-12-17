package au.com.siac.gallery.slideshow.controller;

import au.com.siac.gallery.slideshow.entity.SlideshowConfiguration;
import au.com.siac.gallery.slideshow.service.SlideshowConfigurationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/slideshow-config")
public class SlideshowConfigurationController {
    
    @Autowired
    private SlideshowConfigurationService service;
    
    @GetMapping("/event/{eventId}")
    public ResponseEntity<SlideshowConfiguration> getByEventId(@PathVariable Long eventId) {
        Optional<SlideshowConfiguration> config = service.getByEventId(eventId);
        return config.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/event/{eventId}/exists")
    public ResponseEntity<Map<String, Boolean>> existsByEventId(@PathVariable Long eventId) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", service.existsByEventId(eventId));
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/event/{eventId}")
    public ResponseEntity<SlideshowConfiguration> createOrUpdate(
            @PathVariable Long eventId,
            @RequestBody SlideshowConfiguration config) {
        
        SlideshowConfiguration saved = service.createOrUpdate(eventId, config);
        return ResponseEntity.ok(saved);
    }
    
    @DeleteMapping("/event/{eventId}")
    public ResponseEntity<Map<String, String>> deleteByEventId(@PathVariable Long eventId) {
        service.deleteByEventId(eventId);
        Map<String, String> response = new HashMap<>();
        response.put("status", "deleted");
        return ResponseEntity.ok(response);
    }
}
