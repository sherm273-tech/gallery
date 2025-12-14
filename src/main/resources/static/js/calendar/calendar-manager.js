// Calendar Manager - Loads and displays events

const CalendarManager = {
    eventsList: null,
    allEvents: [],
    currentFilter: 'all',
    
    init() {
        console.log('CalendarManager initialized');
        this.eventsList = document.getElementById('eventsList');
        this.setupFilterButtons();
        this.loadEvents();
        this.updateStatistics();
    },
    
    setupFilterButtons() {
        const filterButtons = document.querySelectorAll('.calendar-filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all
                filterButtons.forEach(b => b.classList.remove('active'));
                // Add active to clicked
                btn.classList.add('active');
                // Apply filter
                this.currentFilter = btn.dataset.filter;
                this.applyFilter();
            });
        });
    },
    
    async loadEvents() {
        console.log('Loading events...');
        
        try {
            const response = await fetch('/api/events/list');
            if (!response.ok) {
                throw new Error('Failed to load events');
            }
            
            this.allEvents = await response.json();
            console.log('Loaded events:', this.allEvents);
            
            this.applyFilter();
        } catch (error) {
            console.error('Error loading events:', error);
            this.showError('Failed to load events');
        }
    },
    
    applyFilter() {
        let filteredEvents = [...this.allEvents];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
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
                // Show all
                break;
        }
        
        this.displayEvents(filteredEvents);
    },
    
    async updateStatistics() {
        try {
            const response = await fetch('/api/events/statistics');
            if (!response.ok) return;
            
            const stats = await response.json();
            console.log('Statistics from API:', stats);
            
            document.getElementById('statToday').textContent = stats.todayEvents || 0;
            document.getElementById('statWeek').textContent = stats.weekEvents || 0;
            document.getElementById('statPending').textContent = stats.upcomingEvents || 0;
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    },
    
    displayEvents(events) {
        if (!this.eventsList) return;
        
        // Clear current content
        this.eventsList.innerHTML = '';
        
        if (!events || events.length === 0) {
            this.eventsList.innerHTML = `
                <div class="empty-state">
                    <p>No events found for this filter.</p>
                </div>
            `;
            return;
        }
        
        // Sort events by date (newest first)
        events.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
        
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
        const formattedDate = eventDate.toLocaleDateString('en-AU', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        const timeStr = event.eventTime ? 
            `<div class="event-time">${event.eventTime}</div>` : '';
        
        const descStr = event.description ? 
            `<div class="event-description">${event.description}</div>` : '';
        
        const completedClass = event.completed ? 'completed-badge' : '';
        
        card.innerHTML = `
            <div class="event-type-icon">${this.getEventIcon(event.eventType)}</div>
            <div class="event-title">${event.title}</div>
            ${timeStr}
            <div class="event-date-badge ${completedClass}">${formattedDate}</div>
            ${descStr}
            <div class="event-actions">
                ${!event.completed ? 
                    `<button class="event-action-btn complete-btn" onclick="CalendarManager.completeEvent(${event.id})">✓ Complete</button>` :
                    `<button class="event-action-btn" onclick="CalendarManager.uncompleteEvent(${event.id})">↶ Undo</button>`
                }
                <button class="event-action-btn delete-btn" onclick="CalendarManager.deleteEvent(${event.id})">🗑️ Delete</button>
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
