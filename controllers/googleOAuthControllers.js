const { getDocsWhereCondition, getDocIdWithCondition, deleteDocById } = require('../services/firebaseServices')
const { generateAuthUrl, getTokens, addEvent, deleteEvent, } = require('../services/googleOAuthServices')

const redirectToGoogle = ( req, res ) => {
    const url = generateAuthUrl()
    res.redirect( url )
}

const handleGoogleCallback = async ( req, res ) => {

    console.log('llega');
    const { code } = req.query
    console.log(code);
    try {
        const tokens = await getTokens( code )
        console.log(tokens);

        //await SAVE TOKENS IN USER WITH USER ID


        ////REPLACE WITH ACTUAL DOMAIN LATER
        // res.redirect('https://gethangapp.com/settings/calendar');
        res.redirect('https://hang-client.vercel.app/settings/calendar');


    } catch ( error ) {
        console.error( 'OAuth Error:', error );
        res.status( 500 ).send( 'Authentication failed.' );
    }
}

const createCalendarEvent = async ( req, res ) => {
    try {
        // const tokens = GET TOKENS FROM USER DB 
        const event = req.body
        const response = await addEvent( tokens, event )
        res.status( 201 ).json( response )
        
    } catch ( error ) {
        console.error( 'Add Event Error:', error );
        res.status( 500 ).send( 'Failed to add the event.' );
    }
}

const deleteCalendarEvent = async ( req, res ) => {

    try {
        // const tokens = GET TOKENS FROM USER DB 
        const eventId = req.params.eventId
        await deleteEvent( tokens, eventId)
        res.status( 200 ).json( { message: 'Event Deleted' } )
        
    } catch ( error ) {
        console.error( 'Add Event Error:', error );
        res.status( 500 ).send( 'Failed to add the event.' );
    }
}

const checkCalendarConnection = async ( req, res ) => {
    try {
        const userId = req.user.uid
        const tokens = await getDocsWhereCondition('calendarTokens', 'userId', userId )
        res.json({ isConnected: tokens.length > 0 ? true : false  })
    } catch ( error ) {
        res.status( 500 ).json({ message: 'Could not check connection.'})
    }
}

const disconnectCalendar = async ( req, res ) => {
    try {
        const userId = req.user.uid
        const docId = await getDocIdWithCondition('calendarTokens', 'userId', userId )
        await deleteDocById('calendarTokens', docId )
        res.status( 200 ).json({ message: 'Calendar disconnected '})
    } catch ( error ) {
        res.status( 500 ).json({ message: 'Could not check connection.'})
    }
}

module.exports = {
    handleGoogleCallback,
    redirectToGoogle,
    createCalendarEvent,
    deleteCalendarEvent,
    checkCalendarConnection,
    disconnectCalendar

}