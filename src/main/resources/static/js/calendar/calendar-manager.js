// Calendar Manager - Loads and displays events

const CalendarManager = {
    eventsList: null,
    allEvents: [],
    currentFilter: 'all',
    searchQuery: '',
    activeTypeFilters: new Set(),
    
    init() {
        console.log('CalendarManager initialized');
        this.eventsList = document.getElementById('eventsList');
        this.setupShowCompletedToggle();
        this.setupEventSearch();
        this.setupFilterChips();
        this.loadEvents();
        this.updateStatistics();
    },
    
    setupShowCompletedToggle() {
        const checkbox = document.getElementById('showCompletedCheckbox');
        if (checkbox) {
            checkbox.addEventListener('change', () => {
                this.currentFilter = checkbox.checked ? 'completed' : 'all';
                this.applyFilter();
            if (window.CalendarFC) CalendarFC.loadEvents(this.allEvents);
            if (window.CalendarFC) CalendarFC.refresh();
            });
        }
    },
    
    setupEventSearch() {
        const searchInput = document.getElementById('eventSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (searchInput) {
            // Search as user types (debounced)
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchQuery = e.target.value.toLowerCase().trim();
                    this.applyFilter();
                    
                    // Show/hide clear button
                    if (clearBtn) {
                        clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
                    }
                }, 300);
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.searchQuery = '';
                    this.applyFilter();
                    clearBtn.style.display = 'none';
                    searchInput.focus();
                }
            });
        }
    },
    
    setupFilterChips() {
        const chips = document.querySelectorAll('.filter-chip');
        const clearChipsBtn = document.getElementById('clearChipsBtn');
        
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                const eventType = chip.dataset.type;
                
                // Toggle filter
                if (this.activeTypeFilters.has(eventType)) {
                    this.activeTypeFilters.delete(eventType);
                    chip.classList.remove('active');
                } else {
                    this.activeTypeFilters.add(eventType);
                    chip.classList.add('active');
                }
                
                // Show/hide clear all button
                if (clearChipsBtn) {
                    clearChipsBtn.style.display = this.activeTypeFilters.size > 0 ? 'block' : 'none';
                }
                
                this.applyFilter();
            });
        });
        
        if (clearChipsBtn) {
            clearChipsBtn.addEventListener('click', () => {
                this.activeTypeFilters.clear();
                chips.forEach(chip => chip.classList.remove('active'));
                clearChipsBtn.style.display = 'none';
                this.applyFilter();
            });
        }
    },
    
    async loadEvents() {
        console.log('Loading events...');
        
        try {
            const response = await fetch('/api/events/list');
            if (!response.ok) {
                throw new Error('Failed to load events');
            }
            
            const events = await response.json();
            // Filter out null events
            this.allEvents = events.filter(e => e != null);
            console.log('Loaded events:', this.allEvents);
            
            this.applyFilter();
            if (window.CalendarFC) CalendarFC.refresh();
            
            // Refresh calendar grid dots
            if (window.CalendarGrid) {
                CalendarGrid.refreshEventDots();
            }
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events');
        }
    },
    
    applyFilter() {
        let filteredEvents = [...this.allEvents];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Apply completed/all filter
        switch(this.currentFilter) {
            case 'today':
                const todayStr = today.toISOString().split('T')[0];
                filteredEvents = filteredEvents.filter(e => e.eventDate === todayStr);
                break;
                
            case 'upcoming':
                const weekFromNow = new Date(today);
                weekFromNow.setDate(weekFromNow.getDate() + 7);
                filteredEvents = filteredEvents.filter(e => {
                    const eventDate = new Date(e.eventDate);
                    return eventDate >= today && eventDate <= weekFromNow && !e.completed;
                });
                break;
                
            case 'completed':
                filteredEvents = filteredEvents.filter(e => e.completed);
                break;
                
            case 'all':
            default:
                // Show all (will apply other filters below)
                break;
        }
        
        // Apply type chip filters (if any are active)
        if (this.activeTypeFilters.size > 0) {
            filteredEvents = filteredEvents.filter(event => {
                return this.activeTypeFilters.has(event.eventType);
            });
        }
        
        // Apply search filter
        if (this.searchQuery) {
            filteredEvents = filteredEvents.filter(event => {
                const titleMatch = event.title.toLowerCase().includes(this.searchQuery);
                const descMatch = event.description ? event.description.toLowerCase().includes(this.searchQuery) : false;
                const typeMatch = event.eventType.toLowerCase().includes(this.searchQuery);
                return titleMatch || descMatch || typeMatch;
            });
        }
        
        this.displayEvents(filteredEvents);
    },
    
    async updateStatistics() {
        try {
            const response = await fetch('/api/events/statistics');
            if (!response.ok) return;
            
            const stats = await response.json();
            console.log('Statistics from API:', stats);
            
            // Only update if elements exist (they might not be on all pages)
            const statToday = document.getElementById('statToday');
            const statWeek = document.getElementById('statWeek');
            const statPending = document.getElementById('statPending');
            
            if (statToday) statToday.textContent = stats.todayEvents || 0;
            if (statWeek) statWeek.textContent = stats.weekEvents || 0;
            if (statPending) statPending.textContent = stats.upcomingEvents || 0;
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    },
    
    displayEvents(events) {
        if (!this.eventsList) return;
        
        // Clear current content
        this.eventsList.innerHTML = '';
        
        if (!events || events.length === 0) {
            const emptyMessage = this.searchQuery 
                ? `No events found matching "${this.searchQuery}"` 
                : 'No events found for this filter.';
            
            this.eventsList.innerHTML = `
                <div class="empty-state">
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }
        
        // Filter out null events
        events = events.filter(e => e != null && e.eventDate != null);
        
        if (events.length === 0) {
            this.eventsList.innerHTML = `
                <div class="empty-state">
                    <p>No valid events found</p>
                </div>
            `;
            return;
        }
        
        // Sort events by date ASCENDING (next event first, then future events)
        events.sort((a, b) => {
            const dateA = new Date(a.eventDate);
            const dateB = new Date(b.eventDate);
            const dateCompare = dateA - dateB;
            
            // If same date, sort by time
            if (dateCompare === 0) {
                if (a.eventTime && b.eventTime) {
                    return a.eventTime.localeCompare(b.eventTime);
                }
                if (a.eventTime) return -1;
                if (b.eventTime) return 1;
            }
            return dateCompare;
        });
        
        // Display each event
        events.forEach(event => {
            const eventCard = this.createEventCard(event);
            this.eventsList.appendChild(eventCard);
        });
    },
    
    createEventCard(event) {
        const card = document.createElement('div');
        card.className = `event-card type-${event.eventType}`;
        if (event.completed) {
            card.classList.add('completed');
        }
        
        const eventDate = new Date(event.eventDate);
        const eventEndDate = event.eventEndDate ? new Date(event.eventEndDate) : eventDate;
        
        // Check if multi-day event
        const isMultiDay = event.eventEndDate && event.eventEndDate !== event.eventDate;
        
        let dateTimeStr;
        if (isMultiDay) {
            // Show date range for multi-day events
            const startDateStr = eventDate.toLocaleDateString('en-AU', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
            const endDateStr = eventEndDate.toLocaleDateString('en-AU', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
            dateTimeStr = `${startDateStr} - ${endDateStr}`;
            if (event.eventTime) {
                dateTimeStr += ` • ${event.eventTime}`;
            }
        } else {
            // Single day event
            const formattedDate = eventDate.toLocaleDateString('en-AU', { 
                weekday: 'short', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
            dateTimeStr = event.eventTime ? 
                `${formattedDate} • ${event.eventTime}` : 
                formattedDate;
        }
        
        const descStr = event.description ? 
            `<div class="event-description">${event.description}</div>` : '';
        
        const completedClass = event.completed ? 'completed-badge' : '';
        
        // Add play slideshow button if config exists
        const playSlideshowBtn = event.hasSlideshowConfig ? 
            `<button class="play-slideshow-btn" onclick="EventSlideshowPlayer.playEventSlideshow(${event.id})">▶ Play Slideshow</button>` : 
            `<div class="slideshow-placeholder"></div>`;
        
        // Add notification badges if notifications enabled
        let notificationBadges = '';
        if (event.notificationsEnabled) {
            if (event.notifyBrowser) {
                notificationBadges += '<span class="notif-badge browser">🔔</span>';
            }
            if (event.notifyEmail) {
                notificationBadges += '<span class="notif-badge email">📧</span>';
            }
            if (event.notifySms) {
                notificationBadges += '<span class="notif-badge sms">📱</span>';
            }
        }
        
        card.innerHTML = `
            <div class="event-header">
                <div class="event-type-icon">${this.getEventIcon(event.eventType)}</div>
                <div class="event-header-content">
                    <div class="event-title">
                        ${event.title}
                        ${notificationBadges ? `<span class="notification-badges">${notificationBadges}</span>` : ''}
                    </div>
                    <div class="event-datetime">${dateTimeStr}</div>
                    ${descStr}
                </div>
            </div>
            <div class="event-footer">
                ${playSlideshowBtn}
                <div class="event-actions">
                    ${!event.completed ? 
                        `<button class="event-action-btn complete-btn" onclick="CalendarManager.completeEvent(${event.id})">✓ Complete</button>` :
                        `<button class="event-action-btn undo-btn" onclick="CalendarManager.uncompleteEvent(${event.id})">↶ Undo</button>`
                    }
                    <button class="event-action-btn edit-btn" onclick="CalendarManager.editEvent(${event.id})">✏️ Edit</button>
                    <button class="event-action-btn delete-btn" onclick="CalendarManager.deleteEvent(${event.id})">🗑️ Delete</button>
                </div>
            </div>
        `;
        
        return card;
    },
    
    getEventIcon(type) {
        const icons = {
            'appointment': '📅',
            'birthday': '🎂',
            'bill': '💳',
            'reminder': '⏰',
            'holiday': '🎉',
            'val-athletics': '🏃',
            'other': '📌'
        };
        return icons[type] || '📌';
    },
    
    async completeEvent(eventId) {
        try {
            const response = await fetch(`/api/events/complete/${eventId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log('Event marked complete');
                this.loadEvents();
                this.updateStatistics();
            }
        } catch (error) {
            console.error('Error completing event:', error);
        }
    },
    
    async uncompleteEvent(eventId) {
        try {
            const response = await fetch(`/api/events/uncomplete/${eventId}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                console.log('Event marked incomplete');
                this.loadEvents();
                this.updateStatistics();
            }
        } catch (error) {
            console.error('Error uncompleting event:', error);
        }
    },
    
    async deleteEvent(eventId) {
        if (!confirm('Delete this event?')) return;
        
        try {
            const response = await fetch(`/api/events/delete/${eventId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                console.log('Event deleted');
                this.loadEvents();
                this.updateStatistics();
            } else {
                console.error('Failed to delete event');
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    },
    
    showEventDetails(eventId) {
        const event = this.allEvents.find(e => e.id === eventId);
        if (event) {
            this.renderEventList([event], 'Event Details');
        }
    },
    
    filterByDate(date) {
        console.log('Filtering events for date:', date);
        const dateStr = date.toISOString().split('T')[0];
        
        const eventsOnDate = this.allEvents.filter(event => {
            if (event.completed) return false;
            
            // Check if the clicked date falls within the event's date range
            const eventStartDate = event.eventDate;
            const eventEndDate = event.eventEndDate || event.eventDate;
            
            // Date falls within range if it's >= start and <= end
            return dateStr >= eventStartDate && dateStr <= eventEndDate;
        });
        
        if (eventsOnDate.length > 0) {
            const formattedDate = date.toLocaleDateString('en-AU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            this.renderEventList(eventsOnDate, formattedDate);
        } else {
            this.eventsList.innerHTML = '<div class="empty-state"><p>No events on this date.</p></div>';
        }
    },
    
    
    renderEventList(events, title) {
        // Update sidebar title
        const sidebarTitle = document.querySelector('.sidebar-title');
        if (sidebarTitle) {
            sidebarTitle.textContent = title || 'Upcoming Events';
        }
        
        this.eventsList.innerHTML = '';
        
        if (events.length === 0) {
            this.eventsList.innerHTML = '<div class="empty-state"><p>No events found.</p></div>';
            return;
        }
        
        events.forEach(event => {
            const card = this.createEventCard(event);
            this.eventsList.appendChild(card);
        });
    },
    
    editEvent(eventId) {
        console.log('Editing event:', eventId);
        const event = this.allEvents.find(e => e.id === eventId);
        if (event && window.CalendarForm) {
            CalendarForm.openFormForEdit(event);
        }
    },
    
    showError(message) {
        if (this.eventsList) {
            this.eventsList.innerHTML = `
                <div class="empty-state">
                    <p style="color: #ff4d4d;">${message}</p>
                </div>
            `;
        }
    }
};

// Make it globally available
window.CalendarManager = CalendarManager;
