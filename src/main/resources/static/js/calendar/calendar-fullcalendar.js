// FullCalendar Integration

const CalendarFC = {
    calendar: null,
    
    init() {
        console.log('FullCalendar initialized');
        
        const calendarEl = document.getElementById('fullcalendar');
        
        this.calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
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
            nowIndicator: true
        });
        
        this.calendar.render();
    },
    
    loadEvents(events) {
        if (!this.calendar) return;
        
        // Convert your events to FullCalendar format
        const fcEvents = events.filter(e => !e.completed).map(event => {
            const startDate = event.eventDate;
            // Only use endDate if it exists and is different from startDate
            const endDate = event.eventEndDate && event.eventEndDate !== event.eventDate ? event.eventEndDate : null;
            
            // For multi-day events, FullCalendar needs end date to be the day AFTER the last day
            let fcEndDate = null;
            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setDate(endDateObj.getDate() + 1);
                fcEndDate = endDateObj.toISOString().split('T')[0];
            }
            
            return {
                id: event.id,
                title: event.title,
                start: event.eventTime ? `${startDate}T${event.eventTime}` : startDate,
                end: fcEndDate,  // Only set if multi-day event
                allDay: !event.eventTime,
                extendedProps: {
                    description: event.description,
                    eventType: event.eventType,
                    completed: event.completed,
                    originalEndDate: endDate || startDate
                },
                backgroundColor: this.getEventColor(event.eventType),
                borderColor: this.getEventColor(event.eventType)
            };
        });
        
        this.calendar.removeAllEvents();
        this.calendar.addEventSource(fcEvents);
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
        console.log('Date clicked:', info.dateStr);
        
        // Filter events by date in sidebar
        if (window.CalendarManager) {
            const date = new Date(info.dateStr);
            CalendarManager.filterByDate(date);
        }
    },
    
    refresh() {
        if (this.calendar && window.CalendarManager) {
            this.loadEvents(CalendarManager.allEvents);
        }
    }
};

window.CalendarFC = CalendarFC;
