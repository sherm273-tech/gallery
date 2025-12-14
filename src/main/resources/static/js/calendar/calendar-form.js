// Calendar Form Handler

const CalendarForm = {
    formModal: null,
    eventForm: null,
    
    init() {
        console.log('CalendarForm initialized');
        
        this.formModal = document.getElementById('eventFormModal');
        this.eventForm = document.getElementById('eventForm');
        const addEventBtn = document.getElementById('addEventBtn');
        const closeFormBtn = document.getElementById('closeFormBtn');
        const cancelEventBtn = document.getElementById('cancelEventBtn');
        
        // Open form when clicking + Add Event
        if (addEventBtn) {
            addEventBtn.addEventListener('click', () => this.openForm());
        }
        
        // Close form buttons
        if (closeFormBtn) {
            closeFormBtn.addEventListener('click', () => this.closeForm());
        }
        if (cancelEventBtn) {
            cancelEventBtn.addEventListener('click', () => this.closeForm());
        }
        
        // Handle form submission
        if (this.eventForm) {
            this.eventForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Set default date to today
        const eventDateInput = document.getElementById('eventDate');
        if (eventDateInput) {
            const today = new Date().toISOString().split('T')[0];
            eventDateInput.value = today;
        }
    },
    
    openForm() {
        console.log('Opening event form...');
        if (this.formModal) {
            this.formModal.classList.add('active');
        }
    },
    
    closeForm() {
        console.log('Closing event form...');
        if (this.formModal) {
            this.formModal.classList.remove('active');
        }
        if (this.eventForm) {
            this.eventForm.reset();
        }
    },
    
    async handleSubmit(e) {
        e.preventDefault();
        console.log('Form submitted!');
        
        const formData = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            eventDate: document.getElementById('eventDate').value,
            eventTime: document.getElementById('eventTime').value,
            eventType: document.getElementById('eventType').value,
            recurring: false,
            completed: false
        };
        
        console.log('Event data:', formData);
        
        try {
            const response = await fetch('/api/events/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                console.log('Event created successfully!');
                this.closeForm();
                // Reload events
                if (window.CalendarManager) {
                    CalendarManager.loadEvents();
                }
            } else {
                console.error('Failed to create event');
            }
        } catch (error) {
            console.error('Error creating event:', error);
        }
    }
};

// Make it globally available
window.CalendarForm = CalendarForm;
