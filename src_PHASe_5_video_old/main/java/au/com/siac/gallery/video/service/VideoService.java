package au.com.siac.gallery.video.service;

import au.com.siac.gallery.memories.entity.PhotoMetadata;
import au.com.siac.gallery.memories.repository.PhotoMetadataRepository;
import au.com.siac.gallery.video.entity.VideoPlaylist;
import au.com.siac.gallery.video.repository.VideoPlaylistRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class VideoService {
    
    private static final Logger logger = LoggerFactory.getLogger(VideoService.class);
    
    @Autowired
    private PhotoMetadataRepository photoMetadataRepository;
    
    @Autowired
    private VideoPlaylistRepository videoPlaylistRepository;
    
    /**
     * Get all videos from the database
     */
    public List<PhotoMetadata> getAllVideos() {
        return photoMetadataRepository.findByMediaType("VIDEO");
    }
    
    /**
     * Get videos by folder
     */
    public List<PhotoMetadata> getVideosByFolder(String folder) {
        List<PhotoMetadata> allVideos = getAllVideos();
        return allVideos.stream()
                .filter(v -> v.getFilePath().startsWith(folder + "/"))
                .collect(Collectors.toList());
    }
    
    /**
     * Get videos sorted by duration
     */
    public List<PhotoMetadata> getVideosSortedByDuration(boolean ascending) {
        List<PhotoMetadata> videos = getAllVideos();
        videos.sort((a, b) -> {
            Long durationA = a.getVideoDuration() != null ? a.getVideoDuration() : 0L;
            Long durationB = b.getVideoDuration() != null ? b.getVideoDuration() : 0L;
            return ascending ? durationA.compareTo(durationB) : durationB.compareTo(durationA);
        });
        return videos;
    }
    
    /**
     * Get videos sorted by date
     */
    public List<PhotoMetadata> getVideosSortedByDate(boolean ascending) {
        List<PhotoMetadata> videos = getAllVideos();
        videos.sort((a, b) -> {
            if (ascending) {
                return a.getCaptureDate().compareTo(b.getCaptureDate());
            } else {
                return b.getCaptureDate().compareTo(a.getCaptureDate());
            }
        });
        return videos;
    }
    
    /**
     * Get video statistics
     */
    public Map<String, Object> getVideoStatistics() {
        List<PhotoMetadata> allVideos = getAllVideos();
        
        Map<String, Object> stats = new HashMap<>();
        
        // Total count
        stats.put("totalVideos", allVideos.size());
        
        // Total duration
        long totalDuration = allVideos.stream()
                .mapToLong(v -> v.getVideoDuration() != null ? v.getVideoDuration() : 0L)
                .sum();
        stats.put("totalDuration", totalDuration);
        stats.put("totalDurationFormatted", formatDuration(totalDuration));
        
        // Total file size
        long totalSize = allVideos.stream()
                .mapToLong(v -> v.getFileSize() != null ? v.getFileSize() : 0L)
                .sum();
        stats.put("totalSize", totalSize);
        stats.put("totalSizeFormatted", formatFileSize(totalSize));
        
        // Videos by folder
        Map<String, Integer> byFolder = new HashMap<>();
        for (PhotoMetadata video : allVideos) {
            String folder = extractFolder(video.getFilePath());
            byFolder.put(folder, byFolder.getOrDefault(folder, 0) + 1);
        }
        stats.put("byFolder", byFolder);
        
        // Videos by year
        Map<String, Integer> byYear = new HashMap<>();
        for (PhotoMetadata video : allVideos) {
            if (video.getCaptureDate() != null) {
                String year = String.valueOf(video.getCaptureDate().getYear());
                byYear.put(year, byYear.getOrDefault(year, 0) + 1);
            }
        }
        stats.put("byYear", byYear);
        
        // Duration breakdown
        long shortVideos = allVideos.stream()
                .filter(v -> v.getVideoDuration() != null && v.getVideoDuration() < 60)
                .count();
        long mediumVideos = allVideos.stream()
                .filter(v -> v.getVideoDuration() != null && v.getVideoDuration() >= 60 && v.getVideoDuration() < 300)
                .count();
        long longVideos = allVideos.stream()
                .filter(v -> v.getVideoDuration() != null && v.getVideoDuration() >= 300)
                .count();
        
        Map<String, Long> durationBreakdown = new HashMap<>();
        durationBreakdown.put("short", shortVideos);   // < 1 min
        durationBreakdown.put("medium", mediumVideos); // 1-5 min
        durationBreakdown.put("long", longVideos);     // > 5 min
        stats.put("durationBreakdown", durationBreakdown);
        
        return stats;
    }
    
    /**
     * Get all playlists
     */
    public List<VideoPlaylist> getAllPlaylists() {
        return videoPlaylistRepository.findAllByOrderByCreatedAtDesc();
    }
    
    /**
     * Get playlist by ID
     */
    public Optional<VideoPlaylist> getPlaylistById(Long id) {
        return videoPlaylistRepository.findById(id);
    }
    
    /**
     * Create new playlist
     */
    public VideoPlaylist createPlaylist(String name, String description) {
        if (videoPlaylistRepository.existsByName(name)) {
            throw new IllegalArgumentException("Playlist with name '" + name + "' already exists");
        }
        
        VideoPlaylist playlist = new VideoPlaylist(name);
        playlist.setDescription(description);
        playlist.setVideoPaths("[]");
        
        return videoPlaylistRepository.save(playlist);
    }
    
    /**
     * Update playlist
     */
    public VideoPlaylist updatePlaylist(Long id, String name, String description, List<String> videoPaths) {
        VideoPlaylist playlist = videoPlaylistRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));
        
        if (name != null && !name.equals(playlist.getName())) {
            if (videoPlaylistRepository.existsByName(name)) {
                throw new IllegalArgumentException("Playlist with name '" + name + "' already exists");
            }
            playlist.setName(name);
        }
        
        if (description != null) {
            playlist.setDescription(description);
        }
        
        if (videoPaths != null) {
            String json = serializeStringList(videoPaths);
            playlist.setVideoPaths(json);
            playlist.setVideoCount(videoPaths.size());
            
            // Calculate total duration
            long totalDuration = 0;
            for (String path : videoPaths) {
                Optional<PhotoMetadata> video = photoMetadataRepository.findByFilePath(path);
                if (video.isPresent() && video.get().getVideoDuration() != null) {
                    totalDuration += video.get().getVideoDuration();
                }
            }
            playlist.setTotalDuration(totalDuration);
        }
        
        return videoPlaylistRepository.save(playlist);
    }
    
    /**
     * Delete playlist
     */
    public void deletePlaylist(Long id) {
        videoPlaylistRepository.deleteById(id);
    }
    
    /**
     * Get videos in a playlist
     */
    public List<PhotoMetadata> getPlaylistVideos(Long playlistId) {
        VideoPlaylist playlist = videoPlaylistRepository.findById(playlistId)
                .orElseThrow(() -> new IllegalArgumentException("Playlist not found"));
        
        List<String> paths = deserializeStringList(playlist.getVideoPaths());
        
        List<PhotoMetadata> videos = new ArrayList<>();
        for (String path : paths) {
            Optional<PhotoMetadata> video = photoMetadataRepository.findByFilePath(path);
            video.ifPresent(videos::add);
        }
        
        return videos;
    }
    
    // Helper methods
    
    private String extractFolder(String filePath) {
        int lastSlash = filePath.lastIndexOf('/');
        if (lastSlash > 0) {
            return filePath.substring(0, lastSlash);
        }
        return "root";
    }
    
    private String formatDuration(long seconds) {
        long hours = seconds / 3600;
        long minutes = (seconds % 3600) / 60;
        long secs = seconds % 60;
        
        if (hours > 0) {
            return String.format("%d:%02d:%02d", hours, minutes, secs);
        } else {
            return String.format("%d:%02d", minutes, secs);
        }
    }
    
    private String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.2f KB", bytes / 1024.0);
        } else if (bytes < 1024 * 1024 * 1024) {
            return String.format("%.2f MB", bytes / (1024.0 * 1024));
        } else {
            return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }
    
    /**
     * Simple JSON serialization for list of strings
     * Converts: ["path1", "path2"] to JSON array string
     */
    private String serializeStringList(List<String> list) {
        if (list == null || list.isEmpty()) {
            return "[]";
        }
        
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            if (i > 0) {
                sb.append(",");
            }
            // Escape quotes and backslashes in the string
            String escaped = list.get(i)
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"");
            sb.append("\"").append(escaped).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }
    
    /**
     * Simple JSON deserialization for list of strings
     * Converts: JSON array string to List<String>
     */
    private List<String> deserializeStringList(String json) {
        List<String> result = new ArrayList<>();
        
        if (json == null || json.trim().isEmpty() || json.equals("[]")) {
            return result;
        }
        
        // Remove brackets and split by comma (simple parsing)
        String content = json.trim();
        if (content.startsWith("[") && content.endsWith("]")) {
            content = content.substring(1, content.length() - 1).trim();
        }
        
        if (content.isEmpty()) {
            return result;
        }
        
        // Split by "," but handle escaped quotes
        boolean inQuote = false;
        StringBuilder current = new StringBuilder();
        
        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            
            if (c == '"' && (i == 0 || content.charAt(i - 1) != '\\')) {
                inQuote = !inQuote;
            } else if (c == ',' && !inQuote) {
                String value = current.toString().trim();
                if (value.startsWith("\"") && value.endsWith("\"")) {
                    value = value.substring(1, value.length() - 1);
                }
                // Unescape
                value = value.replace("\\\"", "\"").replace("\\\\", "\\");
                result.add(value);
                current = new StringBuilder();
            } else {
                current.append(c);
            }
        }
        
        // Add last item
        if (current.length() > 0) {
            String value = current.toString().trim();
            if (value.startsWith("\"") && value.endsWith("\"")) {
                value = value.substring(1, value.length() - 1);
            }
            // Unescape
            value = value.replace("\\\"", "\"").replace("\\\\", "\\");
            result.add(value);
        }
        
        return result;
    }
}
