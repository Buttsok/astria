/**
 * Calendar Logic Component Script
 * Handles calendar rendering, event management, and appointment tracking
 */

// ==========================================================================
// Calendar State Management
// ==========================================================================

let currentNavMonth = new Date().getMonth();
let currentNavYear = new Date().getFullYear();
let activeEventId = null;
let activeDayViewDate = null; // Tracks which day the user is viewing

// ==========================================================================
// Calendar Database Initialization & Helpers
// ==========================================================================

function initCalendarDB() {
    if (!localStorage.getItem('calendar_events_db')) {
        const defaultEvents = [
            { id: 'prop-1', title: 'Contract Review (Proposed)', client: 'Juan Dela Cruz', date: '2026-10-20', time: '14:00', status: 'pending' },
            { id: 'appt-1', title: 'Corp Setup Consult', client: 'Maria Santos', date: '2026-10-31', time: '10:00', status: 'confirmed' },
            { id: 'appt-2', title: 'Legal Advisory Sync', client: 'TechCorp Inc.', date: '2026-10-15', time: '14:30', status: 'confirmed' }
        ];
        localStorage.setItem('calendar_events_db', JSON.stringify(defaultEvents));
    }
}

function getEvents() {
    return JSON.parse(localStorage.getItem('calendar_events_db')) || [];
}

function saveEventsDB(events) {
    localStorage.setItem('calendar_events_db', JSON.stringify(events));
}

// ==========================================================================
// Calendar Navigation & Rendering
// ==========================================================================

function changeMonth(step) {
    currentNavMonth += step;
    if (currentNavMonth < 0) { currentNavMonth = 11; currentNavYear--; }
    if (currentNavMonth > 11) { currentNavMonth = 0; currentNavYear++; }
    renderCalendarUI();
}

function renderCalendarUI() {
    const monthYearEl = document.getElementById('calendarMonthYear');
    const gridEl = document.getElementById('calendarGrid');
    const listEl = document.getElementById('appointmentsList');

    if (!monthYearEl || !gridEl || !listEl) return;

    initCalendarDB();
    const events = getEvents();

    // 1. Render Global Appointments List (Right Column)
    listEl.innerHTML = '';
    events.sort((a,b) => new Date(a.date+'T'+a.time) - new Date(b.date+'T'+b.time));

    events.forEach(ev => {
        const dObj = new Date(ev.date);
        const monthStr = dObj.toLocaleString('en-US', { month: 'short' });
        const dayStr = String(dObj.getDate()).padStart(2, '0');

        let [h, m] = ev.time.split(':');
        let ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        const displayTime = `${h}:${m} ${ampm}`;
        const displayPill = `${monthStr} ${dayStr} - ${displayTime}`;

        if(ev.status === 'pending') {
            listEl.innerHTML += `
                <div class="appointment-card border-orange" id="${ev.id}">
                    <div class="appt-details">
                        <h4 style="font-size: 1.1rem; color: #1e293b;">${ev.title}</h4>
                        <p style="font-size: 0.85rem; color: #64748b;">Client: ${ev.client}</p>
                        <span class="pill pill-orange" style="margin-top: 8px;">${displayPill}</span>
                    </div>
                    <div class="appt-actions" style="display: flex; gap: 8px;">
                        <button style="background: #58B673; border: none; border-radius: 4px; padding: 6px; cursor: pointer;" onclick="handleProposal('${ev.id}', 'accept')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button style="background: #D9534F; border: none; border-radius: 4px; padding: 6px; cursor: pointer;" onclick="handleProposal('${ev.id}', 'decline')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>`;
        } else {
            listEl.innerHTML += `
                <div class="appointment-card border-green" id="${ev.id}" style="cursor:pointer;" onclick="openEventModal('${ev.id}', '${ev.title.replace(/'/g, "\\'")}', '${ev.date}', '${ev.time}', '${ev.client.replace(/'/g, "\\'")}')">
                    <div class="appt-details">
                        <h4 style="font-size: 1.1rem; color: #1e293b;">${ev.title}</h4>
                        <p style="font-size: 0.85rem; color: #64748b;">Client: ${ev.client}</p>
                        <span class="pill pill-green" style="margin-top: 8px;">${displayPill}</span>
                    </div>
                </div>`;
        }
    });

    if(events.length === 0) {
        listEl.innerHTML = '<p style="color:#64748b; font-size:0.9rem; text-align:center; padding: 20px 0;">No appointments found.</p>';
    }

    // 2. Render Calendar Grid
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    monthYearEl.innerText = `${months[currentNavMonth]} ${currentNavYear}`;
    gridEl.innerHTML = '';

    const firstDay = new Date(currentNavYear, currentNavMonth, 1).getDay();
    const daysInMonth = new Date(currentNavYear, currentNavMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentNavYear, currentNavMonth, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        gridEl.innerHTML += `<div class="cal-cell empty"><span class="date-num">${daysInPrevMonth - firstDay + i + 1}</span></div>`;
    }

    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        let isToday = (i === today.getDate() && currentNavMonth === today.getMonth() && currentNavYear === today.getFullYear());
        let currentDayStr = `${currentNavYear}-${String(currentNavMonth+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        let dayEvents = events.filter(e => e.date === currentDayStr);
        let eventDots = '';
        dayEvents.forEach(e => {
            let color = e.status === 'pending' ? '#E8B87A' : '#58B673';
            eventDots += `<div style="width:100%; height:4px; border-radius:2px; background-color:${color}; margin-top:3px;"></div>`;
        });

        let bgStyle = isToday ? 'background-color: #e6f4ea;' : '';
        let textStyleStr = isToday ? 'color: #58B673; font-weight:800;' : '';

        // INTERCEPTION: Now calls openDayViewModal instead of openEventModal
        gridEl.innerHTML += `
            <div class="cal-cell" style="${bgStyle}" onclick="openDayViewModal('${currentDayStr}')">
                <span class="date-num" style="${textStyleStr}">${String(i).padStart(2, '0')}</span>
                <div style="width:100%; display:flex; flex-direction:column; gap:2px; margin-top:4px;">${eventDots}</div>
            </div>`;
    }

    const totalCellsRendered = firstDay + daysInMonth;
    const totalGridCells = totalCellsRendered > 35 ? 42 : 35;
    for (let i = 1; i <= (totalGridCells - totalCellsRendered); i++) {
        gridEl.innerHTML += `<div class="cal-cell empty"><span class="date-num">${String(i).padStart(2, '0')}</span></div>`;
    }
}

// ==========================================================================
// Day View Modal Functions
// ==========================================================================

function openDayViewModal(dateStr) {
    activeDayViewDate = dateStr;
    const modal = document.getElementById('dayViewModal');
    const title = document.getElementById('dayViewTitle');
    const list = document.getElementById('dayViewList');

    // Format the date for the title (e.g., "September 08, 2026")
    const dObj = new Date(dateStr);
    const displayDate = dObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    title.innerText = `Schedule for ${displayDate}`;

    let events = getEvents().filter(e => e.date === dateStr);
    events.sort((a,b) => new Date(a.date+'T'+a.time) - new Date(b.date+'T'+b.time));

    list.innerHTML = '';
    if (events.length === 0) {
        list.innerHTML = '<p style="text-align: center; color: #64748b; margin: 30px 0; font-size: 0.95rem;">No appointments scheduled for this day.</p>';
    } else {
        events.forEach(ev => {
            let [h, m] = ev.time.split(':');
            let ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            const displayTime = `${h}:${m} ${ampm}`;

            let borderColor = ev.status === 'pending' ? 'border-orange' : 'border-green';
            let pillColor = ev.status === 'pending' ? 'pill-orange' : 'pill-green';

            // Populate the mini-cards inside the popup
            list.innerHTML += `
                <div class="appointment-card ${borderColor}" style="cursor: pointer; margin-bottom: 12px; transition: transform 0.1s;" onclick="openEventModal('${ev.id}', '${ev.title.replace(/'/g, "\\'")}', '${ev.date}', '${ev.time}', '${ev.client.replace(/'/g, "\\'")}')">
                    <div class="appt-details">
                        <h4 style="font-size: 1.05rem; color: #1e293b; margin: 0 0 4px 0;">${ev.title}</h4>
                        <p style="font-size: 0.85rem; color: #64748b; margin: 0;">Client: ${ev.client}</p>
                        <span class="pill ${pillColor}" style="margin-top: 8px; display: inline-block;">${displayTime}</span>
                    </div>
                </div>`;
        });
    }

    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeDayViewModal() {
    const modal = document.getElementById('dayViewModal');
    modal.classList.add('hidden');
    modal.classList.remove('active');
    activeDayViewDate = null;
}

function openEventModalFromDay() {
    // Opens the Event Create form specifically for the date currently being viewed
    let dateToPass = activeDayViewDate || new Date().toISOString().split('T')[0];
    openEventModal(null, '', dateToPass, '09:00', '');
}

// ==========================================================================
// Event CRUD Modal Functions
// ==========================================================================

function openEventModal(eventId = null, title = '', date = '', time = '', client = '') {
    const modal = document.getElementById('eventModal');
    const deleteBtn = document.getElementById('deleteEventBtn');
    const modalTitle = document.getElementById('modalTitle');

    activeEventId = eventId;

    if (eventId && title) {
        modalTitle.innerText = "Edit Appointment";
        deleteBtn.style.display = 'block';
        document.getElementById('eventTitle').value = title;
        document.getElementById('eventClient').value = client;
        document.getElementById('eventDate').value = date;
        document.getElementById('eventTime').value = time;
    } else {
        modalTitle.innerText = "Create New Appointment";
        deleteBtn.style.display = 'none';
        document.getElementById('eventForm').reset();
        if(date) document.getElementById('eventDate').value = date;
        if(time) document.getElementById('eventTime').value = time;
    }

    modal.classList.remove('hidden');
    modal.classList.add('active');
}

function closeEventModal() {
    const modal = document.getElementById('eventModal');
    modal.classList.add('hidden');
    modal.classList.remove('active');
    activeEventId = null;
}

function saveEvent(e) {
    e.preventDefault();
    const title = document.getElementById('eventTitle').value;
    const client = document.getElementById('eventClient').value || 'Unassigned';
    const date = document.getElementById('eventDate').value;
    const time = document.getElementById('eventTime').value;

    let events = getEvents();

    if (activeEventId) {
        let ev = events.find(x => x.id === activeEventId);
        if(ev) {
            ev.title = title;
            ev.client = client;
            ev.date = date;
            ev.time = time;
        }
        if (typeof showToast === 'function') showToast("Appointment updated.");
    } else {
        events.push({
            id: 'appt-' + Date.now(),
            title: title,
            client: client,
            date: date,
            time: time,
            status: 'confirmed'
        });
        if (typeof showToast === 'function') showToast("New appointment added.");
    }

    saveEventsDB(events);
    closeEventModal();
    renderCalendarUI();

    // Automatically refresh the day view popup if it happens to be open in the background
    if(activeDayViewDate) {
        openDayViewModal(activeDayViewDate);
    }
}

function deleteEvent() {
    if (!activeEventId) return;
    if (confirm("Are you sure you want to delete this appointment?")) {
        let events = getEvents();
        events = events.filter(x => x.id !== activeEventId);
        saveEventsDB(events);
        if (typeof showToast === 'function') showToast("Appointment removed.");

        closeEventModal();
        renderCalendarUI();

        // Refresh the day view popup
        if(activeDayViewDate) {
            openDayViewModal(activeDayViewDate);
        }
    }
}

function handleProposal(eventId, action) {
    let events = getEvents();
    let ev = events.find(x => x.id === eventId);
    if(!ev) return;

    if (action === 'accept') {
        ev.status = 'confirmed';
        if (typeof showToast === 'function') showToast("Appointment Accepted!");
    } else {
        events = events.filter(x => x.id !== eventId);
        if (typeof showToast === 'function') showToast("Appointment Declined.");
    }

    saveEventsDB(events);
    renderCalendarUI();
}

// ==========================================================================
// Calendar Sync Functionality
// ==========================================================================

function syncCalendar() {
    const icsContent =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//IWAKI Astria//Legal Calendar Sync//EN
BEGIN:VEVENT
UID:event-sync@iwaki.ph
DTSTAMP:20260908T000000Z
DTSTART:20260908T100000Z
DTEND:20260908T110000Z
SUMMARY:Corp Setup Consult - Maria Santos
DESCRIPTION:Initial corporate setup consultation overview.
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'iwaki_schedule_sync.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof showToast === 'function') showToast("Calendar sync file downloaded.");
}

// ==========================================================================
// Page Load Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    if(window.location.pathname.includes('calendar.html')) {
        renderCalendarUI();
    }
});