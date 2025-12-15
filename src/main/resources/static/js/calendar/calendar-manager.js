// Calendar Manager - Loads and displays events

const CalendarManager = {
    eventsList: null,
    allEvents: [],
    currentFilter: 'all',
    
    init() {
        console.log('CalendarManager initialized');
        this.eventsList = document.getElementById('eventsList');
        this.setupShowCompletedToggle();
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
        
        card.innerHTML = `
            <div class="event-header">
                <div class="event-type-icon">${this.getEventIcon(event.eventType)}</div>
                <div class="event-header-content">
                    <div class="event-title">${event.title}</div>
                    <div class="event-datetime">${dateTimeStr}</div>
                </div>
            </div>
            ${descStr}
            <div class="event-actions">
                ${!event.completed ? 
                    `<button class="event-action-btn complete-btn" onclick="CalendarManager.completeEvent(${event.id})">✓ Complete</button>` :
                    `<button class="event-action-btn" onclick="CalendarManager.uncompleteEvent(${event.id})">↶ Undo</button>`
                }
                <button class="event-action-btn edit-btn" onclick="CalendarManager.editEvent(${event.id})">✏️ Edit</button>
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
            return event.eventDate === dateStr && !event.completed;
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
