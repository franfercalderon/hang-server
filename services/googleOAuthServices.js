const { google } = require('googleapis');
const { getDocsWhereCondition } = require('./firebaseServices');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [ 'https://www.googleapis.com/auth/calendar.events.owned' ]

function generateAuthUrl( options ) {

    const redirectUri = 'https://api.gethangapp.com/calendarAPI/auth/google/callback';

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: SCOPES,
        state: options.state,
        redirect_uri: redirectUri
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

async function getFreshAccessToken( userId ) {

    try {
        const response = await getDocsWhereCondition( "calendarTokens", "userId", userId )
        if( response.length > 0 ){
            const tokensDoc = response[0]
            console.log(tokensDoc);
            if (!tokensDoc || !tokensDoc.tokens.refresh_token) {
                throw new Error("No refresh token available");
            }
            oauth2Client.setCredentials({
                refresh_token: tokensDoc.tokens.refresh_token
            });

            const { credentials } = await oauth2Client.refreshAccessToken()
            return credentials.access_token
    
        } else {
            return null
        }
        
    } catch (error) {
        console.error("Error in getFreshAccessToken:", error);
        throw error;
    }
}
  

function setCredentials( tokens ) {
    oauth2Client.setCredentials( tokens );
    return oauth2Client;
}

async function handleAddEventToCalendar( userId, event ) {

    try {
        const accessToken = await getFreshAccessToken( userId )
        if ( accessToken ){
            // oauth2Client.setCredentials({ access_token: accessToken });
            const calendar = google.calendar({ version: 'v3' })
            const response = await calendar.events.insert({
                auth: oauth2Client,
                calendarId: 'primary',
                requestBody:{
                    summary: event.title,
                    description: event.description || undefined,
                    location: event.location?.address || undefined,
                    colorId: '7',
                    start:{
                        dateTime: new Date ( event.starts ).toISOString()
                    },
                    end:{
                        dateTime: new Date ( event.ends ).toISOString()
                    }
                }
            })
            return response
        } 
        
    } catch (error) {
        console.error("Error in handleAddEventToCalendar:", error);
        throw error;
    }
}

// async function addEvent( userId, eventData ) {
//     const auth = setCredentials( tokens );
//     const calendar = google.calendar({ version: 'v3', auth });

//     const event = {
//         summary: eventData.summary,
//         description: eventData.description,
//         start: { dateTime: eventData.start },
//         end: { dateTime: eventData.end },
//     };

//     const response = await calendar.events.insert({
//         calendarId: 'primary',
//         resource: event,
//     });

//     return response.data;
// }

// curl -H "Authorization: Bearer ya29.a0AXeO80S61ipkTWJ9UVdH231JXXF3AMiFjZMRaSHpLGyNwtuEQdz6VqfHQxjKZ3qerceo9pDECHAkIkGKx391TSKwK3oHLu47vaoXEOccCiB9Z99shHpiBxPRWsc77y6IuSSuJvCASMMBItbi3wO6oOHTyvurrn1MS5kFiGNUaCgYKASUSARESFQHGX2MihSJn1-wjUA849aVuRhA-fQ0175" https://www.googleapis.com/oauth2/v2/userinfo


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
    // addEvent, 
    deleteEvent,
    getUserEmail,
    getFreshAccessToken,
    handleAddEventToCalendar
}
