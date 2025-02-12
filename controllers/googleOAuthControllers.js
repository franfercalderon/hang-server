const { getDocsWhereCondition, getDocIdWithCondition, deleteDocById, createDocumentInCollection } = require('../services/firebaseServices')
const { generateAuthUrl, getTokens, addEvent, deleteEvent, getUserEmail } = require('../services/googleOAuthServices')

const redirectToGoogle = ( req, res ) => {

    const userId = req.query.userId
    const url = generateAuthUrl({
        state: JSON.stringify({ userId })
    })
    console.log(url);
    res.redirect( url )
}

const handleGoogleCallback = async ( req, res ) => {

    const { code, state } = req.query
    console.log(code);
    console.log(state);

    try {
        const tokens = await getTokens( code )
        const tokenObjectForDb = {
            tokens: tokens,
            userId: JSON.parse( state )
        }
        console.log(tokenObjectForDb);

        const tokenDocId = await createDocumentInCollection('', tokenObjectForDb )
        if ( tokenDocId ){
            res.redirect('https://gethangapp.com/settings/calendar');
        } else {
            res.state( 400 ).json({ message: 'Could not store tokens in database' })
        }

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
        const tokensDoc = await getDocsWhereCondition('calendarTokens', 'userId', userId )
        if( tokensDoc.length > 0 ){
            const email = getUserEmail( tokensDoc.tokens )
            res.json({ connectedEmail: email  })
        } else {
            res.json({ connectedEmail: null  })
        }
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