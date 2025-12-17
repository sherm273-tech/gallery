package au.com.siac.gallery.slideshow.service;

import au.com.siac.gallery.slideshow.entity.SlideshowConfiguration;
import au.com.siac.gallery.slideshow.repository.SlideshowConfigurationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class SlideshowConfigurationService {
    
    @Autowired
    private SlideshowConfigurationRepository repository;
    
    public Optional<SlideshowConfiguration> getByEventId(Long eventId) {
        return repository.findByEventId(eventId);
    }
    
    public boolean existsByEventId(Long eventId) {
        return repository.existsByEventId(eventId);
    }
    
    @Transactional
    public SlideshowConfiguration save(SlideshowConfiguration config) {
        return repository.save(config);
    }
    
    @Transactional
    public SlideshowConfiguration createOrUpdate(Long eventId, SlideshowConfiguration config) {
        Optional<SlideshowConfiguration> existing = repository.findByEventId(eventId);
        
        if (existing.isPresent()) {
            SlideshowConfiguration existingConfig = existing.get();
            existingConfig.setSelectedFolders(config.getSelectedFolders());
            existingConfig.setSelectedMusic(config.getSelectedMusic());
            existingConfig.setShuffleAll(config.getShuffleAll());
            existingConfig.setRandomizeImages(config.getRandomizeImages());
            existingConfig.setRandomizeMusic(config.getRandomizeMusic());
            existingConfig.setStartFolder(config.getStartFolder());
            existingConfig.setDisplayDuration(config.getDisplayDuration());
            return repository.save(existingConfig);
        } else {
            config.setEventId(eventId);
            return repository.save(config);
        }
    }
    
    @Transactional
    public void deleteByEventId(Long eventId) {
        repository.deleteByEventId(eventId);
    }
}
