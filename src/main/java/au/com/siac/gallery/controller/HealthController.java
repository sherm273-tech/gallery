package au.com.siac.gallery.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

@Controller
public class HealthController {
    
    /**
     * Heartbeat endpoint to keep session alive
     * Called every 30 seconds from JavaScript when music/slideshow is playing
     */
    @GetMapping("/api/heartbeat")
    @ResponseBody
    public ResponseEntity<?> heartbeat() {
        return ResponseEntity.ok(Map.of(
            "status", "alive",
            "timestamp", System.currentTimeMillis()
        ));
    }
}
