const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON requests and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. Serve your frontend static files (HTML, CSS, JS, images) from the root folder
app.use(express.static(path.join(__dirname)));

// 2. Initialize Supabase Client
const SUPABASE_URL = 'https://cyssvluzwzftsskveet.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xxFzGiH-Ut3EpB_vqs1UVg_G8uZYrNo';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 3. Dynamic Node.js Calendar Feed Endpoint for Android / iOS Sync (Pulls from Supabase)
app.get('/api/calendar-feed.ics', async (req, res) => {
    try {
        // Fetch appointments directly from your Supabase database table
        const { data: appointments, error } = await supabase
            .from('appointments')
            .select('*');

        if (error) {
            console.error('Supabase error fetching appointments:', error);
            throw error;
        }

        // Set mandatory headers for calendar subscriptions
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="iwaki_schedule.ics"');

        let icsData = "BEGIN:VCALENDAR\r\n";
        icsData += "VERSION:2.0\r\n";
        icsData += "PRODID:-//IWAKI Astria//Legal Calendar Sync//EN\r\n";
        icsData += "CALSCALE:GREGORIAN\r\n";
        icsData += "METHOD:PUBLISH\r\n";

        if (appointments && appointments.length > 0) {
            appointments.forEach(app => {
                const startDateTime = new Date(app.start_time);
                const endDateTime = app.end_time ? new Date(app.end_time) : new Date(startDateTime.getTime() + (60 * 60 * 1000));

                const formatDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

                icsData += "BEGIN:VEVENT\r\n";
                icsData += `UID:appointment-${app.id}@iwaki.ph\r\n`;
                icsData += `DTSTAMP:${formatDate(new Date())}\r\n`;
                icsData += `DTSTART:${formatDate(startDateTime)}\r\n`;
                icsData += `DTEND:${formatDate(endDateTime)}\r\n`;
                icsData += `SUMMARY:${app.title} ${app.client_name ? `- ${app.client_name}` : ''} (${app.status || 'confirmed'})\r\n`;
                icsData += `DESCRIPTION:Client legal appointment for ${app.client_name || 'N/A'}.\r\n`;
                icsData += "END:VEVENT\r\n";
            });
        }

        icsData += "END:VCALENDAR\r\n";

        res.status(200).send(icsData);

    } catch (err) {
        console.error('Error generating ICS feed:', err);
        res.status(500).send('Error generating calendar feed');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`IWAKI Astria server running locally at http://localhost:${PORT}`);
});