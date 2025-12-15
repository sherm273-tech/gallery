// Calendar Form Handler

const CalendarForm = {
    formModal: null,
    eventForm: null,
    currentEditId: null,
    
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
    },
    
    openForm() {
        console.log('Opening event form for new event...');
        this.currentEditId = null;
        this.updateFormTitle('Add Event');
        
        // Set default date to today
        const eventDateInput = document.getElementById('eventDate');
        if (eventDateInput) {
            const today = new Date().toISOString().split('T')[0];
            eventDateInput.value = today;
        }
        
        if (this.formModal) {
            this.formModal.classList.add('active');
        }
    },
    
    openFormForEdit(event) {
        console.log('Opening event form for editing...', event);
        this.currentEditId = event.id;
        this.updateFormTitle('Edit Event');
        
        // Populate form with event data
        document.getElementById('eventTitle').value = event.title || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventDate').value = event.eventDate || '';
        document.getElementById('eventEndDate').value = event.eventEndDate || '';
        document.getElementById('eventTime').value = event.eventTime || '';
        document.getElementById('eventType').value = event.eventType || 'other';
        
        if (this.formModal) {
            this.formModal.classList.add('active');
        }
    },
    
    updateFormTitle(title) {
        const formTitle = document.getElementById('eventFormTitle');
        if (formTitle) {
            formTitle.textContent = title;
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
        this.currentEditId = null;
        this.updateFormTitle('Add Event');
    },
    
    async handleSubmit(e) {
        e.preventDefault();
        console.log('Form submitted!');
        
        const startDate = document.getElementById('eventDate').value;
        const endDate = document.getElementById('eventEndDate').value;
        
        const formData = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            eventDate: startDate,
            eventEndDate: endDate || null,  // Send null if empty, backend will handle default
            eventTime: document.getElementById('eventTime').value,
            eventType: document.getElementById('eventType').value,
            recurring: false,
            completed: false
        };
        
        console.log('Event data:', formData);
        
        try {
            let response;
            
            if (this.currentEditId) {
                // Update existing event
                response = await fetch(`/api/events/update/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new event
                response = await fetch('/api/events/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            
            if (response.ok) {
                console.log(this.currentEditId ? 'Event updated successfully!' : 'Event created successfully!');
                this.closeForm();
                // Reload events
                if (window.CalendarManager) {
                    CalendarManager.loadEvents();
                    CalendarManager.updateStatistics();
                }
            } else {
                console.error('Failed to save event');
                alert('Failed to save event. Please try again.');
            }
        } catch (error) {
            console.error('Error saving event:', error);
            alert('Error saving event. Please try again.');
        }
    }
};

// Make it globally available
window.CalendarForm = CalendarForm;
