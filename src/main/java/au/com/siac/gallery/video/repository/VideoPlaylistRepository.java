package au.com.siac.gallery.video.repository;

import au.com.siac.gallery.video.entity.VideoPlaylist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VideoPlaylistRepository extends JpaRepository<VideoPlaylist, Long> {
    
    /**
     * Find playlist by name
     */
    Optional<VideoPlaylist> findByName(String name);
    
    /**
     * Find all playlists ordered by creation date
     */
    List<VideoPlaylist> findAllByOrderByCreatedAtDesc();
    
    /**
     * Check if playlist with name exists
     */
    boolean existsByName(String name);
}
