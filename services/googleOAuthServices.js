const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [ 'https://www.googleapis.com/auth/calendar.events.owned' ]

function generateAuthUrl() {

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
    });
}

async function getTokens( code ) {
    const { tokens } = await oauth2Client.getToken( code );
    return tokens;
}

async function getUserEmail ( tokens ) {
    const auth = setCredentials( tokens );
    const oauth2 = google.oauth2({ version: 'v2', auth });

    const response = await oauth2.userinfo.get();
    return response.data.email;
}
  

function setCredentials( tokens ) {
    oauth2Client.setCredentials( tokens );
    return oauth2Client;
}

async function addEvent( tokens, eventData ) {
    const auth = setCredentials( tokens );
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: eventData.start },
        end: { dateTime: eventData.end },
    };

    const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
    });

    return response.data;
}

async function deleteEvent( tokens, eventId ) {
    const auth = setCredentials( tokens );
    const calendar = google.calendar({ version: 'v3', auth });

    await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
    });
}
  

module.exports = { 
    generateAuthUrl, 
    getTokens, 
    setCredentials, 
    addEvent, 
    deleteEvent,
    getUserEmail 
}
