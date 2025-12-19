// Calendar Form Handler

const CalendarForm = {
    formModal: null,
    eventForm: null,
    currentEditId: null,
    
    init() {
        console.log('CalendarForm initialised');
        
        this.formModal = document.getElementById('eventFormModal');
        this.eventForm = document.getElementById('eventForm');
        const addEventBtn = document.getElementById('addEventBtn');
        const closeFormBtn = document.getElementById('closeFormBtn');
        const cancelEventBtn = document.getElementById('cancelEventBtn');
        
        // Auto-open date/time pickers on click
        this.setupDateTimePickers();
        
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

        // Initialise slideshow config if available
        if (window.EventSlideshowConfig) {
            EventSlideshowConfig.init();
        }
        
        // Initialise notification form if available
        if (window.EventNotificationForm) {
            EventNotificationForm.init();
        }
    },
    
    setupDateTimePickers() {
        // Auto-open date picker when clicking date fields
        const dateFields = ['eventDate', 'eventEndDate'];
        dateFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('click', function() {
                    this.showPicker();
                });
            }
        });
        
        // Auto-open time picker when clicking time field
        const timeField = document.getElementById('eventTime');
        if (timeField) {
            timeField.addEventListener('click', function() {
                this.showPicker();
            });
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

        // Setup slideshow config (don't await - let it load in background)
        if (window.EventSlideshowConfig) {
            EventSlideshowConfig.ensureListenersAttached();
            
            // Clear selections and hide config panel
            const enableCheckbox = document.getElementById('enableSlideshowConfig');
            const configContent = document.getElementById('slideshowConfigContent');
            if (enableCheckbox) {
                enableCheckbox.checked = false;
                configContent.style.display = 'none';
            }
            EventSlideshowConfig.selectedFolders = [];
            EventSlideshowConfig.selectedMusic = [];
            
            // Reset form values
            document.getElementById('shuffleAllCheckboxEvent').checked = false;
            document.getElementById('randomizeCheckboxEvent').checked = true;
            document.getElementById('randomizeMusicCheckboxEvent').checked = false;
            document.getElementById('speedSelectEvent').value = 5000;
            document.getElementById('startFolderSelectEvent').value = '';
            
            // Start loading lists (shows spinner when checkbox is checked)
            EventSlideshowConfig.renderLists();
        }
        
        // Clear notification form
        if (window.EventNotificationForm) {
            EventNotificationForm.clearForm();
        }
        
        if (this.formModal) {
            this.formModal.classList.add('active');
        }
    },
    
    async openFormForEdit(event) {
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

        // Setup slideshow config (don't await - let it load in background)
        if (window.EventSlideshowConfig) {
            EventSlideshowConfig.ensureListenersAttached();
            EventSlideshowConfig.renderLists(); // Shows "Loading..." then populates
            await EventSlideshowConfig.loadConfigForEvent(event.id);
        }
        
        // Load notification settings
        if (window.EventNotificationForm) {
            EventNotificationForm.loadNotificationData(event);
        }
        
        if (this.formModal) {
            this.formModal.classList.add('active');
        }
    },
    
    updateFormTitle(title) {
        const formTitle = document.getElementById('eventFormTitle');
        if (formTitle) {
            // Add calendar icon to both Add and Edit titles
            const icon = title.includes('Edit') ? '✏️' : '📅';
            formTitle.textContent = `${icon} ${title}`;
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

        // Clear slideshow config
        if (window.EventSlideshowConfig) {
            EventSlideshowConfig.clearConfig();
        }
    },
    
    async handleSubmit(e) {
        e.preventDefault();
        console.log('Form submitted!');
        
        const startDate = document.getElementById('eventDate').value;
        const endDate = document.getElementById('eventEndDate').value;
        
        // Get notification data
        const notificationData = window.EventNotificationForm ? 
            EventNotificationForm.getNotificationData() : 
            { notificationsEnabled: false, notificationTimings: null, notifyBrowser: true, notifyEmail: false, notifySms: false };
        
        const formData = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            eventDate: startDate,
            eventEndDate: endDate || null,  // Send null if empty, backend will handle default
            eventTime: document.getElementById('eventTime').value,
            eventType: document.getElementById('eventType').value,
            recurring: false,
            completed: false,
            ...notificationData  // Merge notification settings
        };
        
        console.log('Event data:', formData);
        
        try {
            let response;
            let savedEventId;
            
            if (this.currentEditId) {
                // Update existing event
                response = await fetch(`/api/events/update/${this.currentEditId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                savedEventId = this.currentEditId;
            } else {
                // Create new event
                response = await fetch('/api/events/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    const savedEvent = await response.json();
                    savedEventId = savedEvent.id;
                }
            }
            
            if (response.ok) {
                console.log(this.currentEditId ? 'Event updated successfully!' : 'Event created successfully!');
                
                // Save slideshow configuration
                if (window.EventSlideshowConfig && savedEventId) {
                    await EventSlideshowConfig.saveConfig(savedEventId);
                }

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
