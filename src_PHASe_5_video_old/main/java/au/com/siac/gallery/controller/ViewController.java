package au.com.siac.gallery.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller for serving HTML pages
 */
@Controller
public class ViewController {
    
    /**
     * Serve main calendar page
     */
    @GetMapping("/index")
    public String index() {
        return "index";
    }
    
    /**
     * Serve notification settings page
     */
    @GetMapping("/settings")
    public String notificationSettings() {
        return "settings";
    }
}
