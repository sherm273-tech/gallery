// Simple Calendar Grid - MagicMirror style

const CalendarGrid = {
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    selectedDate: null,
    
    init() {
        console.log('CalendarGrid initialized');
        
        document.getElementById('prevMonth').addEventListener('click', () => {
            this.currentMonth--;
            if (this.currentMonth < 0) {
                this.currentMonth = 11;
                this.currentYear--;
            }
            this.render();
        });
        
        document.getElementById('nextMonth').addEventListener('click', () => {
            this.currentMonth++;
            if (this.currentMonth > 11) {
                this.currentMonth = 0;
                this.currentYear++;
            }
            this.render();
        });
        
        this.render();
    },
    
    render() {
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
        
        // Update header
        document.getElementById('calMonth').textContent = `${months[this.currentMonth]} ${this.currentYear}`;
        
        // Build calendar
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const prevDaysInMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
        
        let html = '<thead><tr>';
        ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach(day => {
            html += `<th>${day}</th>`;
        });
        html += '</tr></thead><tbody><tr>';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Previous month days
        for (let i = firstDay - 1; i >= 0; i--) {
            html += `<td class="other-month">${prevDaysInMonth - i}</td>`;
        }
        
        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            if ((firstDay + day - 1) % 7 === 0 && day !== 1) {
                html += '</tr><tr>';
            }
            
            const date = new Date(this.currentYear, this.currentMonth, day);
            date.setHours(0, 0, 0, 0);
            
            let classes = [];
            
            if (date.getTime() === today.getTime()) {
                classes.push('today');
            }
            
            if (this.hasEvent(date)) {
                classes.push('has-event');
            }
            
            if (this.selectedDate && date.getTime() === this.selectedDate.getTime()) {
                classes.push('selected');
            }
            
            const classStr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
            html += `<td${classStr} onclick="CalendarGrid.selectDate(${this.currentYear},${this.currentMonth},${day})">${day}</td>`;
        }
        
        // Next month days
        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        for (let day = 1; day <= remaining; day++) {
            html += `<td class="other-month">${day}</td>`;
        }
        
        html += '</tr></tbody>';
        
        document.getElementById('calGrid').innerHTML = html;
    },
    
    hasEvent(date) {
        if (!window.CalendarManager || !CalendarManager.allEvents) return false;
        
        const dateStr = date.toISOString().split('T')[0];
        return CalendarManager.allEvents.some(e => e.eventDate === dateStr && !e.completed);
    },
    
    selectDate(year, month, day) {
        this.selectedDate = new Date(year, month, day);
        this.selectedDate.setHours(0, 0, 0, 0);
        this.render();
        
        // Filter events
        if (window.CalendarManager) {
            CalendarManager.filterByDate(this.selectedDate);
        }
    },
    
    refresh() {
        this.render();
    }
};

window.CalendarGrid = CalendarGrid;
