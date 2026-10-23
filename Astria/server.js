const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Serve your frontend static files (HTML, CSS, JS, images) from the root folder
app.use(express.static(path.join(__dirname)));

// 2. Dynamic Node.js Calendar Feed Endpoint for Android / iOS Sync
app.get('/api/calendar-feed.ics', (req, res) => {
    // In production, fetch these appointments dynamically from your real database
    const events = [
        { title: 'Corp Setup Consult', client: 'Maria Santos', date: '2026-09-08', time: '10:00' },
        { title: 'Legal Advisory Sync', client: 'TechCorp Inc.', date: '2026-09-15', time: '14:30' }
    ];

    // Set mandatory headers for calendar subscriptions
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline; filename="iwaki_schedule.ics"');

    let icsData = "BEGIN:VCALENDAR\r\n";
    icsData += "VERSION:2.0\r\n";
    icsData += "PRODID:-//IWAKI Astria//Legal Calendar Sync//EN\r\n";
    icsData += "CALSCALE:GREGORIAN\r\n";
    icsData += "METHOD:PUBLISH\r\n";

    events.forEach(ev => {
        const startDateTime = new Date(`${ev.date}T${ev.time}:00`);
        const endDateTime = new Date(startDateTime.getTime() + (60 * 60 * 1000)); // 1 hour duration

        const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        icsData += "BEGIN:VEVENT\r\n";
        icsData += `UID:${ev.date}-${ev.time}-${ev.client.replace(/\s+/g, '')}@iwaki.ph\r\n`;
        icsData += `DTSTAMP:${formatDate(new Date())}\r\n`;
        icsData += `DTSTART:${formatDate(startDateTime)}\r\n`;
        icsData += `DTEND:${formatDate(endDateTime)}\r\n`;
        icsData += `SUMMARY:${ev.title} - ${ev.client}\r\n`;
        icsData += `DESCRIPTION:Client legal appointment for ${ev.client}.\r\n`;
        icsData += "END:VEVENT\r\n";
    });

    icsData += "END:VCALENDAR\r\n";

    res.status(200).send(icsData);
});

// Start the server
app.listen(PORT, () => {
    console.log(`IWAKI Astria server running locally at http://localhost:${PORT}`);
});