// FullCalendar Integration

const CalendarFC = {
    calendar: null,
    
    init() {
        console.log('FullCalendar initialised');
        
        const calendarEl = document.getElementById('fullcalendar');
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
            },
            customButtons: {
                today: {
                    text: 'today',
                    click: () => {
                        // Go to today's date
                        this.calendar.today();
                        
                        // Load events for today
                        setTimeout(() => {
                            const today = new Date();
                            console.log('[CalendarFC] Today button clicked, loading events for:', today);
                            if (window.CalendarManager) {
                                CalendarManager.filterByDate(today);
                            }
                        }, 100);
                    }
                }
            },
            events: [],
            eventClick: this.handleEventClick.bind(this),
            dateClick: this.handleDateClick.bind(this),
            height: 'auto',
            eventColor: '#4a9eff',
            eventTextColor: '#ffffff',
            displayEventTime: true,
            displayEventEnd: false,
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                meridiem: 'short'
            },
            validRange: null,
            nowIndicator: true,
            eventDidMount: (info) => {
                // Add indicators after each event is mounted
                setTimeout(() => this.addSlideshowIndicators(), 10);
            },
            // ADDED: Dispatch event when calendar view changes (month navigation)
            datesSet: (dateInfo) => {
                const currentDate = dateInfo.view.currentStart;
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1; // JS months are 0-indexed
                
                console.log('[CalendarFC] Month changed:', year, month);
                
                // Dispatch custom event for calendar-memories.js to listen to
                document.dispatchEvent(new CustomEvent('calendarMonthChanged', {
                    detail: { year: year, month: month }
                }));
            }
        });
        
        this.calendar.render();
        
        // ADDED: Dispatch calendarRendered event after initial render
        setTimeout(() => {
            document.dispatchEvent(new CustomEvent('calendarRendered'));
        }, 100);
    },
    
    loadEvents(events) {
        if (!this.calendar) return;
        
        // Convert your events to FullCalendar format
        const fcEvents = events.filter(e => !e.completed).map(event => {
            // eventStartDatetime and eventEndDatetime are ISO strings from backend
            const startDT = event.eventStartDatetime;
            const endDT = event.eventEndDatetime;
            
            // Check if this is an all-day event (time is 00:00:00)
            const startDate = new Date(startDT);
            const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0 && startDate.getSeconds() === 0;
            
            // For multi-day all-day events, FullCalendar needs end date to be the day AFTER
            let fcEnd = endDT;
            if (isAllDay && endDT && startDT !== endDT) {
                const endDate = new Date(endDT);
                endDate.setDate(endDate.getDate() + 1);
                fcEnd = endDate.toISOString();
            }
            
            return {
                id: event.id,
                title: event.title,
                start: startDT,
                end: fcEnd || startDT,
                allDay: isAllDay,
                extendedProps: {
                    description: event.description,
                    eventType: event.eventType,
                    completed: event.completed,
                    originalEndDatetime: endDT,
                    hasSlideshowConfig: event.hasSlideshowConfig
                },
                backgroundColor: this.getEventColor(event.eventType),
                borderColor: this.getEventColor(event.eventType)
            };
        });
        
        this.calendar.removeAllEvents();
        this.calendar.addEventSource(fcEvents);
        
        // Re-render indicators after events are loaded
        setTimeout(() => this.addSlideshowIndicators(), 100);
    },
    
    addSlideshowIndicators() {
        // Find all event elements and add indicators/quick play buttons
        const eventElements = document.querySelectorAll('.fc-event');
        
        eventElements.forEach(eventEl => {
            const event = this.calendar.getEventById(eventEl.fcSeg?.eventRange?.def?.publicId);
            if (!event) return;
            
            const hasSlideshowConfig = event.extendedProps?.hasSlideshowConfig;
            if (!hasSlideshowConfig) return;
            
            // Check if already has indicator
            if (eventEl.querySelector('.event-slideshow-indicator')) return;
            
            // Add indicator badge
            const indicator = document.createElement('span');
            indicator.className = 'event-slideshow-indicator';
            indicator.title = 'Has slideshow configuration';
            
            // Add quick play button
            const quickPlay = document.createElement('button');
            quickPlay.className = 'event-quick-play';
            quickPlay.innerHTML = '▶';
            quickPlay.title = 'Play slideshow';
            quickPlay.onclick = (e) => {
                e.stopPropagation();
                EventSlideshowPlayer.playEventSlideshow(event.id);
            };
            
            // Find title element to prepend indicators (put them BEFORE the title)
            const titleEl = eventEl.querySelector('.fc-event-title');
            if (titleEl) {
                // Insert quick play button at the beginning
                titleEl.insertBefore(quickPlay, titleEl.firstChild);
                // Insert indicator after quick play button
                titleEl.insertBefore(indicator, quickPlay.nextSibling);
            }
        });
    },
    
    getEventColor(type) {
        const colors = {
            'appointment': '#4a9eff',
            'birthday': '#ff6b9d',
            'bill': '#ffa500',
            'reminder': '#9b59b6',
            'holiday': '#2ecc71',
            'val-athletics': '#ff5722',
            'other': '#95a5a6'
        };
        return colors[type] || '#4a9eff';
    },
    
    handleEventClick(info) {
        console.log('Event clicked:', info.event);
        
        // Show event details in sidebar
        const eventId = parseInt(info.event.id);
        if (window.CalendarManager) {
            CalendarManager.showEventDetails(eventId);
        }
    },
    
    handleDateClick(info) {
        console.log('[CalendarFC] Date clicked:', info.dateStr);
        console.log('[CalendarFC] Full date info:', info);
        
        // Filter events by date in sidebar
        if (window.CalendarManager) {
            const date = new Date(info.dateStr);
            console.log('[CalendarFC] Calling filterByDate with:', date);
            CalendarManager.filterByDate(date);
        } else {
            console.error('[CalendarFC] CalendarManager not available!');
        }
    },
    
    refresh() {
        if (this.calendar && window.CalendarManager) {
            this.loadEvents(CalendarManager.allEvents);
        }
    }
};

window.CalendarFC = CalendarFC;
