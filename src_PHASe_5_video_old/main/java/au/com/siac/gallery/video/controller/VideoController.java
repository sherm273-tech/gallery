package au.com.siac.gallery.video.controller;

import au.com.siac.gallery.memories.entity.PhotoMetadata;
import au.com.siac.gallery.video.entity.VideoPlaylist;
import au.com.siac.gallery.video.service.VideoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/videos")
public class VideoController {
    
    @Autowired
    private VideoService videoService;
    
    /**
     * Get all videos
     */
    @GetMapping("/list")
    public ResponseEntity<List<PhotoMetadata>> getAllVideos(
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String folder
    ) {
        List<PhotoMetadata> videos;
        
        if (folder != null && !folder.isEmpty()) {
            videos = videoService.getVideosByFolder(folder);
        } else if ("duration-asc".equals(sortBy)) {
            videos = videoService.getVideosSortedByDuration(true);
        } else if ("duration-desc".equals(sortBy)) {
            videos = videoService.getVideosSortedByDuration(false);
        } else if ("date-asc".equals(sortBy)) {
            videos = videoService.getVideosSortedByDate(true);
        } else if ("date-desc".equals(sortBy)) {
            videos = videoService.getVideosSortedByDate(false);
        } else {
            videos = videoService.getAllVideos();
        }
        
        return ResponseEntity.ok(videos);
    }
    
    /**
     * Get video statistics
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = videoService.getVideoStatistics();
        return ResponseEntity.ok(stats);
    }
    
    /**
     * Get all playlists
     */
    @GetMapping("/playlists")
    public ResponseEntity<List<VideoPlaylist>> getAllPlaylists() {
        List<VideoPlaylist> playlists = videoService.getAllPlaylists();
        return ResponseEntity.ok(playlists);
    }
    
    /**
     * Get playlist by ID
     */
    @GetMapping("/playlists/{id}")
    public ResponseEntity<VideoPlaylist> getPlaylist(@PathVariable Long id) {
        return videoService.getPlaylistById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    /**
     * Get videos in a playlist
     */
    @GetMapping("/playlists/{id}/videos")
    public ResponseEntity<List<PhotoMetadata>> getPlaylistVideos(@PathVariable Long id) {
        List<PhotoMetadata> videos = videoService.getPlaylistVideos(id);
        return ResponseEntity.ok(videos);
    }
    
    /**
     * Create new playlist
     */
    @PostMapping("/playlists")
    public ResponseEntity<VideoPlaylist> createPlaylist(@RequestBody Map<String, String> request) {
        String name = request.get("name");
        String description = request.get("description");
        
        if (name == null || name.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            VideoPlaylist playlist = videoService.createPlaylist(name, description);
            return ResponseEntity.ok(playlist);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Update playlist
     */
    @PutMapping("/playlists/{id}")
    public ResponseEntity<VideoPlaylist> updatePlaylist(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request
    ) {
        try {
            String name = (String) request.get("name");
            String description = (String) request.get("description");
            @SuppressWarnings("unchecked")
            List<String> videoPaths = (List<String>) request.get("videoPaths");
            
            VideoPlaylist playlist = videoService.updatePlaylist(id, name, description, videoPaths);
            return ResponseEntity.ok(playlist);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Delete playlist
     */
    @DeleteMapping("/playlists/{id}")
    public ResponseEntity<Void> deletePlaylist(@PathVariable Long id) {
        videoService.deletePlaylist(id);
        return ResponseEntity.ok().build();
    }
}
