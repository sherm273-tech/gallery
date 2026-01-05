package au.com.siac.gallery.memories.repository;

import au.com.siac.gallery.memories.entity.PhotoMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhotoMetadataRepository extends JpaRepository<PhotoMetadata, Long> {
    
    /**
     * Find all photos taken on a specific month and day, regardless of year
     * NOTE: Uses field names (month, day) not column names (photo_month, photo_day)
     */
    List<PhotoMetadata> findByMonthAndDay(int month, int day);
    
    /**
     * Find photo by file path
     */
    Optional<PhotoMetadata> findByFilePath(String filePath);
    
    /**
     * Count photos for a specific month and day
     * NOTE: Uses Spring Data JPA method naming, not @Query
     */
    long countByMonthAndDay(int month, int day);
    
    /**
     * Check if file path exists
     */
    boolean existsByFilePath(String filePath);
    
    /**
     * Find all photos/videos by media type
     * Used by VideoService to get all videos
     */
    List<PhotoMetadata> findByMediaType(String mediaType);
}
