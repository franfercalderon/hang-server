const { getDocsWhereCondition, getDocIdWithCondition, deleteDocById, createDocumentInCollection, decodeToken, updateDocumentProperties, getDocAndIdWithCondition } = require('../services/firebaseServices')
const { generateAuthUrl, getTokens, addEvent, deleteEvent, getUserEmail, getFreshAccessToken, handleAddEventToCalendar } = require('../services/googleOAuthServices')

const redirectToGoogle = async ( req, res ) => {

    try {
        const authToken = req.query.authToken
        if( !authToken){
            res.status( 400 ).json({ message: 'Could not find auth token'}) 
        } else {
            const decodedToken = await decodeToken( authToken )
            const userId = decodedToken.uid
            const url = generateAuthUrl({
                state: JSON.stringify({ userId }) 
            });            
            
            res.redirect( url )
        }
        
    } catch ( error ) {
        console.error( 'OAuth Error:', error );
        res.status( 500 ).send( 'Redirect failed.' );
    }

}

const handleGoogleCallback = async ( req, res ) => {

    try {

        const { code, state } = req.query
        if( !code || !state ){
            return res.status( 400 ).json({ message: 'Missing code or state in callback url' })
        } else {
            const userIdObject = JSON.parse( state )
            const userId = userIdObject.userId
            const tokens = await getTokens( code )
            const tokenObjectForDb = {
                tokens: tokens,
                userId: userId
            }
    
            const tokenDocId = await createDocumentInCollection('calendarTokens', tokenObjectForDb )

            if ( tokenDocId ){

                const data = { googleCalendarConnected: true  }
                const userDocId = await getDocIdWithCondition( 'users', 'id', userId )

                await updateDocumentProperties('users', userDocId, data )
                res.redirect('https://gethangapp.com/settings/calendar?calendarConnected=true');
            } else {
                res.status( 400 ).json({ message: 'Could not store tokens in database' })
            }
        }

    } catch ( error ) {
        console.error( 'OAuth Error:', error );
        res.status( 500 ).send( 'Authentication failed.' );
    }
}

// const createCalendarEvent = async ( userId,  ) => {
//     try {
//         // const tokens = GET TOKENS FROM USER DB 
//         const event = req.body
//         const response = await addEvent( tokens, event )
//         res.status( 201 ).json( response )
        
//     } catch ( error ) {
//         console.error( 'Add Event Error:', error );
//         res.status( 500 ).send( 'Failed to add the event.' )
//     }
// }

const handleAddCalendarEvents = async ( userId, event, eventDocId ) => {

    try {
        const userResponse = await getDocsWhereCondition( 'users', 'id', userId )
        if( userResponse.length > 0 ){
            const user = userResponse[0]
            if( user.googleCalendarConnected ){
                const response = await handleAddEventToCalendar( userId, event )
                const googleCalendarEventId = response.data.id
                if( userId === event.userId ){
                    console.log('lady gaga own event: ' , eventDocId );
                    const data = { googleEventId: googleCalendarEventId }
                    await updateDocumentProperties( 'scheduledSlots', eventDocId, data )
                    return null
                } else {
                    console.log('lady gaga joined event: ' , eventDocId );
                    return googleCalendarEventId
                }
            } else{
                return null 
            }
        }
        
    } catch ( error ) {
        console.error( 'Add Event Error:', error );
    }
}

// const addAttendantGoogleCalendar = async ( userId, event, eventDocId ) => {

//     try {
//         if( userId && eventId ){
//             const userResponse = await getDocsWhereCondition( 'users', 'id', userId )
//             if( userResponse.length > 0 ){
//                 const user = userResponse[0]
//                 if( user.googleCalendarConnected ){
//                     const response = await handleAddEventToCalendar( userId, event )
//                     const data = { googleEventId: response.data.id }


//                     // await updateDocumentProperties('scheduledSlots', eventDocId, data )
//                 } else{
//                     console.warn('User has not any Google Calendar Connection.')
//                 }
//             }

//             const { data, docId } = await getDocAndIdWithCondition( 'scheduledSlots', 'id', eventId )
//             if ( data && docId ){

//             }
//         }
        
//     } catch ( error ) {
//         console.error( 'Add Event Error:', error );
//     }
// }

const deleteCalendarEvent = async ( req, res ) => {

    try {
        const eventId = req.params.eventId
        await deleteEvent( tokens, eventId )
        res.status( 200 ).json( { message: 'Event Deleted' } )
        
    } catch ( error ) {
        console.error( 'Add Event Error:', error );
        res.status( 500 ).send( 'Failed to add the event.' );
    }
}

const checkCalendarConnection = async ( req, res ) => {
    try {
        const userId = req.user.uid;
        if ( !userId ) {
            return res.json({ isConnected: false });
        }

        const response = await getDocsWhereCondition( "calendarTokens", "userId", userId )

        if ( response.length > 0 ) {

            return res.json({ isConnected: true })

        } else{
            return res.json( { isConnected: false } )
        }

    } catch (error) {
        console.error( "Error checking Google Calendar connection:", error )
        res.status( 500 ).json({ connectedEmail: null })
    }
}


const disconnectCalendar = async ( req, res ) => {
    try {
        const userId = req.user.uid
        const docId = await getDocIdWithCondition('calendarTokens', 'userId', userId )
        await deleteDocById('calendarTokens', docId )
        const data = { googleCalendarConnected: false  }
        await updateDocumentProperties('users', docId, data )
        res.status( 200 ).json({ message: 'Calendar disconnected '})
    } catch ( error ) {
        res.status( 500 ).json({ message: 'Could not check connection.'})
    }
}

module.exports = {
    handleGoogleCallback,
    redirectToGoogle,
    deleteCalendarEvent,
    checkCalendarConnection,
    disconnectCalendar,
    handleAddCalendarEvents

}