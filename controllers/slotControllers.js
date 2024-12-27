const { createDocumentInCollection, getDocsWhereCondition, getDocIdWithCondition, deleteDocById, updateDocArrayById, getDocAndIdWithCondition, updateDocumentProperties, replaceDocArrayById } = require("../services/firebaseServices")
const { v4 } = require('uuid') 
// const { postNotification } = require("./notificationControllers")

const postFixedSlot = async ( req, res ) => {
    try {
        const data = req.body
        const userId = req.user.uid
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'Slot data is required in request body.' } ) 
        }
        const slot = {
            ...data,
            userId,
            id: v4()
        }
        const docId = await createDocumentInCollection( 'fixedSlots', slot )

        if( docId ) {
            res.status( 201 ).json( docId )

            matchRecurringSlots( userId, slot ).catch( error => {

                console.error( 'Error executing matchRecurringSlots:', error )
            })

        } else {
            res.status( 400 ).json( { message: 'Could not post slot.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const postAvailableNowSlot = async ( req, res ) => {
    try {
        const data = req.body
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'Slot data is required in request body.' } ) 
        }
        const slot = {
            ...data,
            userId: req.user.uid,
            id: v4()
        }
        const docId = await createDocumentInCollection( 'availableNowSlots', slot )
        if( docId ) {
            res.status( 201 ).json( docId )
        } else {
            res.status( 400 ).json( { message: 'Could not post slot.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } ) 
    }
}

const postScheduledSlot = async ( req, res ) => {
    try {
        const data = req.body
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'Slot data is required in request body.' } ) 
        }
        const slot = {
            ...data,
            userId: req.user.uid,
            id: v4()
        }
        const docId = await createDocumentInCollection( 'scheduledSlots', slot )
        if( docId ) {
            res.status( 201 ).json( docId )

            if( slot.isPrivate ){

                handlePrivateEvent( slot, 'scheduledSlots' ).catch( error => {

                    console.error( 'Error executing handlePrivateEvent:', error )
                })

            }
        } else {
            res.status( 400 ).json( { message: 'Could not post slot.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const getUserFixedSlots = async ( req, res ) => {

    try {
        const userId = req.params.id
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in request params.' } ) 
        }
        const slots = await getDocsWhereCondition('fixedSlots', 'userId', userId )
        if( slots ) {
            res.status( 201 ).json( slots )
        } else {
            res.status( 400 ).json( { message: 'Could not get user slots.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const deleteFixedSlot = async ( req, res ) => {

    try {
        const slotId = req.params.id
        if( !slotId  ) {
            return res.status( 400 ).json( { message: 'Slot ID is required in request params.' } ) 
        }
        const docRef = await getDocIdWithCondition('fixedSlots', 'id', slotId )
        if( docRef ){
            await deleteDocById( 'fixedSlots', docRef )
            res.status( 200 ).json( { message: 'Slot deleted.' } )
        } else {
            res.status( 400 ).json( { message: 'Could not delete.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const getAvailableNowSlots = async ( req, res ) => {

    try {
        const userId = req.user.uid
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in auth object.' } ) 
        }
        const data = await getDocsWhereCondition('users', 'id', userId )

        if( data.length > 0 ){
            const activity = []
            const user = data[ 0 ]
            const userFriends = user.friends
            for ( const friend of userFriends ){

                const friendActivity = await getDocsWhereCondition('availableNowSlots', 'userId', friend.id )
                if( friendActivity.length > 0 ){
                    for ( const act of friendActivity ){
                        activity.push( act )
                    }
                }
            }
            const currentTime = Date.now()
            const currentActivity = activity.filter( ( act ) => act.ends > currentTime )
    
            if( currentActivity ) {
                res.status( 201 ).json( currentActivity )
            } else {
                res.status( 400 ).json( { message: 'Could not get friends activity.' } )
            }
        } else {
            res.status( 400 ).json( { message: 'Could not find user.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
} 

const getScheduledSlots = async ( req, res ) => {

    try {
        const userId = req.user.uid
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in auth object.' } ) 
        }
        const data = await getDocsWhereCondition('users', 'id', userId )

        if( data.length > 0 ){
            const activity = []
            const user = data[ 0 ]
            const userFriends = user.friends
            for ( const friend of userFriends ){

                const friendActivity = await getDocsWhereCondition('scheduledSlots', 'userId', friend.id )
                if( friendActivity.length > 0 ){

                    for ( const act of friendActivity ){

                        if( !act.isPrivate ){
                            activity.push( act )
                        } 
                    }
                }
            }
            const currentTime = Date.now()
            const currentActivity = activity.filter( ( act ) => act.starts > currentTime )
            
    
            if( currentActivity ) {
                res.status( 201 ).json( currentActivity )
            } else {
                res.status( 400 ).json( { message: 'Could not get friends activity.' } )
            }
        } else {
            res.status( 400 ).json( { message: 'Could not find user.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
} 

const addNewAttendant = async ( req, res ) => {
    try {
        const { user } = req.body
        const authUser = req.user
        const { docId, data } = req.event

        if( req.limitedSeats ){
            const joiningUser = {
                id: authUser.uid,
                imgUrl: user.imgUrl,
                name: user.name
            }
            await updateDocArrayById( 'scheduledSlots', docId, 'attending', joiningUser )
        } 
        
        const notification = {
            userImg: user.imgUrl,
            name: user.name,
            text: req.limitedSeats ? `${user.name} wants to join your Hang` :  `${user.name} wants to meet you now`,
            userId: data.userId,
        }

        await createNotification( notification.userId, notification.text, notification.userImg, notification.name, notification.id )

        res.status( 200 ).json( { message: 'User added to event' } )
        

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const recurringTimeToMinutes = ( time ) => {

    const hour = parseInt( time.hour, 10 )  
    const minute = parseInt( time.minute, 10 )
    const isPM = time.ampm.toLowerCase() === 'pm'

    const normalizedHour = isPM && hour !== 12 ? hour + 12 : ( isPM || hour === 12 ) ? hour : hour 
    const totalMinutes =  normalizedHour * 60 + minute
    
    return totalMinutes
}

const minutesToTime = ( minutes ) => {

    const hour24 = Math.floor( minutes / 60 )
    const minute = minutes % 60
    const ampm = hour24 >= 12 ? 'pm' : 'am'
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    
    return { 
        hour: hour12.toString(),
        minute: minute.toString().padStart( 2, '0' ),
        ampm
    }
}

const getOverlapTime = ( start1, end1, start2, end2, minOverlap ) => {

    if ( start1 < end2 && start2 < end1 ){

        const overlapStart = Math.max( start1, start2 )
        const overlapEnd = Math.min( end1, end2 )

        const overlapDuration = overlapEnd - overlapStart

        if ( overlapDuration < minOverlap - 1 ) {
            return null
        }

        return {
            overlapStart,
            overlapEnd
        }

    } else {
        return null 
    }
}

const findRecurringSlotsMatches = ( userSlot, friendSlots ) => {
    
    const matches = []

    const userStart = recurringTimeToMinutes( userSlot.startTime )
    const userEnd = recurringTimeToMinutes( userSlot.endTime )

    for ( const friendSlot of friendSlots ){
        
        const commonDays = userSlot.days.filter(( day ) => friendSlot.days.includes( day ))

        if( commonDays.length > 0 ){
            
            const friendStart = recurringTimeToMinutes( friendSlot.startTime )
            const friendEnd = recurringTimeToMinutes( friendSlot.endTime )

            const overlap = getOverlapTime( userStart, userEnd, friendStart, friendEnd, 60 )

            if( overlap ){
                const overlapStart = minutesToTime( overlap.overlapStart )
                const overlapEnd = minutesToTime( overlap.overlapEnd )

                matches.push({
                    commonDays,
                    userSlot,
                    friendSlot,
                    overlapTime: {
                        starts: overlapStart,
                        ends: overlapEnd
                    }
                })
            }
        }
    }

    return matches
}

const matchRecurringSlots = async ( userId, newSlot ) => {

    const userResponse = await getDocsWhereCondition( 'users', 'id', userId )

    const matches = []

    if( userResponse.length > 0 ){

        const user = userResponse[ 0 ]
        const userFriends = user.friends

        for ( const friend of userFriends ){

            const friendRecurringSlots = await getDocsWhereCondition( 'fixedSlots', 'userId', friend.id )
            if ( friendRecurringSlots.length > 0 ){
                
                const slotsWithPriority = friendRecurringSlots.map( slot => ({
                    ...slot,
                    priority: friend.priority
                }))

                const friendMatches = findRecurringSlotsMatches( newSlot, slotsWithPriority )

                if( friendMatches.length > 0 ){
                    friendMatches.forEach(( match ) => {
                        matches.push( match )
                    })
                }
            }
        }

        if( matches.length > 0 ){
            await postFixedMatches( matches, user )
        }
    }
}  

const postFixedMatches = async ( matches, user ) => {

    const user1 = {
        userId: user.id,
        name: user.name,
        lastname: user.lastname,
        imgUrl: user.profilePhoto
    }

    for ( const activity of matches ){
        const response = await getDocsWhereCondition('users', 'id', activity.friendSlot.userId )
        const userData = response[ 0 ]
        const match = {
            user1,
            user2: {
                userId: userData.id,
                name: userData.name,
                lastname: userData.lastname,
                imgUrl: userData.profilePhoto
            },
            activity: {
                commonDays: activity.commonDays,
                starts: activity.overlapTime.starts,
                ends: activity.overlapTime.ends,
            }
        }
        await createDocumentInCollection( 'recurringMatches', match )
    }
}

const getFixedMatches = async ( req, res ) => {

    try {
        const matches = []
        const userId = req.user.uid
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'Could not find User ID is required in auth object.' } ) 
        }
        const matches1 = await getDocsWhereCondition('recurringMatches', 'user1.userId', userId )
        if( matches1.length > 0 ){
            matches1.forEach(( activity ) => {
                matches.push( activity )
            })
        }
        const matches2 = await getDocsWhereCondition('recurringMatches', 'user2.userId', userId )
        if( matches2.length > 0 ){
            matches2.forEach(( activity ) => {
                matches.push( activity )
            })
        }
        if( matches ) {
            res.status( 201 ).json( matches )
        } else {
            res.status( 400 ).json( { message: 'Could not get user slots.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const handlePrivateEvent = async ( event, collection ) => {
    try {
        //GETS MATCHES FOR EVENT, BASED ON FRIENDS CALENDARS. ORDERS BY PRIORITY.
        const matches = await matchEventWithRecurringSlots( event )
        const sortedMatches = matches.sort(( a, b ) => a.friendSlot.priority - b.friendSlot.priority )

        //CREATE DOC IN DB FOR INVITEPOOL
        const data = {
            event,
            sortedMatches,
        }
        const poolId = await createDocumentInCollection( 'invitePool' , data )

        //CREATES NOTIFICATIONS TO ALL USERS THT FIT INITIALLY
        const spots = event.spots
        const usersToNotify = sortedMatches.slice( 0, spots ) 

        for( const match of usersToNotify ){

            const invite = {
                event: {
                    userId: event.userId,
                    eventName: event.title,
                    starts: event.starts,
                    ends: event.ends,
                    userImg: event.userImg,
                    userName: event.userName,
                    userLastname: event.userLastname,
                    collection,
                    id: event.id,
                    location: event.location
                },
                invited: {
                    userId: match.friendSlot.userId
                }

            }
            await createDocumentInCollection( 'eventInvites' , invite )

        }

        const updatedArray = sortedMatches.map( item => usersToNotify.some( user => user.friendSlot.id === item.friendSlot.id ) ? { ...item, friendSlot: { ...item.friendSlot, status: 'pending' } } : item )

        await replaceDocArrayById( 'invitePool', poolId, 'sortedMatches', updatedArray )

        
    } catch ( error ) {
        console.error( error )
    }
}

const createNotification = async ( userId, text, senderImgUrl, senderName, system ) => {
    try {
        const notification = {
            userId,
            text,
            timestamp: Date.now(),
            senderImgUrl,
            senderName,
            id: v4(),
            system
        }
        await createDocumentInCollection( 'notifications', notification )
        
    } catch (error) {
        console.log(error);
    }
}

const handleInviteResponse = async ( req, res ) => {

    const invitedId = req.user.uid
    const eventId = req.params.id
    const { accepted, userData, collection } = req.body

    if( !userData || !collection ){
        console.log(userData);
        console.log(collection);
        res.status( 400 ).json( 'Data missing in request body' )
    }

    
    const { data, docId } = await getDocAndIdWithCondition( collection, 'id', eventId )

    //UPDATES INVITE POOL
    const poolResponse = await getDocAndIdWithCondition( 'invitePool', 'event.id', eventId )

    const updatedMatches = poolResponse.data.sortedMatches.map(( match ) => {
        if ( match.friendSlot.userId === invitedId ){
            return { ...match, friendSlot: { ...match.friendSlot, status: accepted ? 'accepted': 'rejected' } } 
        }
        return match
    })

    const poolDocId = poolResponse.docId

    await replaceDocArrayById( 'invitePool', poolDocId, 'sortedMatches', updatedMatches )

    if ( accepted ){

        //CONFIRMS SEAT IN EVENT
        const attending = data.attending
        const newAttendant = {
            name: userData.name,
            lastname: userData.lastname,
            userImg: userData.img,
            userId: invitedId,
        }

        if( attending.length < data.spots ){

            //ADDS USER TO EVENT
            await updateDocArrayById( collection, docId, 'attending', newAttendant )

            //SENDS NOTIFICATIONS            
            const notificationText = `${ newAttendant.name } ${ newAttendant.lastname } has joined your ${ data.title } event.`
            await createNotification( data.userId, notificationText, newAttendant.userImg, newAttendant.name )

            if( data.spots - attending.length === 1 ){
                const notificationText = `Your ${ data.title } event is full!`
                await createNotification( data.userId, notificationText, newAttendant.userImg, newAttendant.name, true )
            }
            res.status( 200 ).json( 'User added to event' )

        } else {
            res.status( 400 ).json( 'Sorry, event is full' )
        }

    } else {

        if( data.attending.length < data.spots){
            const poolData = poolResponse.data
            const matches = poolData.sortedMatches

            const pendingMatches = matches.filter(( match ) => match.friendSlot.status === 'null' )

            const sortedPending = pendingMatches.sort(( a, b ) => a.friendSlot.priority - b.friendSlot.priority )

            if( sortedPending.length > 0 ){

                const invite = {

                    event:{
                        userId: poolData.event.userId,
                        eventName: poolData.event.title,
                        starts: poolData.event.starts,
                        ends: poolData.event.ends,
                        userImg: poolData.event.userImg,
                        userName: poolData.event.userName,
                        userLastname: poolData.event.userLastname,
                        collection,
                        id: poolData.event.id,
                        location: poolData.event.location,
                    },
                    invited: {
                        userId: sortedPending[0].friendSlot.userId
                    }
                }
                await createDocumentInCollection( 'eventInvites' , invite )

                const updatedMatches = matches.map(item => item.friendSlot.userId === sortedPending[0].friendSlot.userId ? { ...item, friendSlot: { ...item.friendSlot, status: 'pending' } } : item )

                await replaceDocArrayById( 'invitePool', poolDocId, 'sortedMatches', updatedMatches )

                
            } else {
                res.status( 200 ).json( 'Invitation rejected' )
            }
        }
        res.status( 200 ).json( 'Invitation rejected' )
    }

    //DELETE USER NOTIFICATION
    const notificationId = await getDocIdWithCondition('eventInvites', 'invited.userId', invitedId )
    await deleteDocById( 'eventInvites', notificationId )

}

const matchEventWithRecurringSlots = async ( event ) => {

    try {
        const matches = []

        const userResponse = await getDocsWhereCondition( 'users', 'id', event.userId )

        if( userResponse.length > 0 ){

            const user = userResponse[ 0 ]
            const userFriends = user.friends

            for ( const friend of userFriends ){
                

                const friendRecurringSlots = await getDocsWhereCondition( 'fixedSlots', 'userId', friend.id )
                if ( friendRecurringSlots.length > 0 ){
                
                    const slotsWithPriority = friendRecurringSlots.map( slot => ({
                        ...slot,
                        priority: friend.priority,
                        status: 'null'
                    }))

                    const friendMatches = findUniqueVsRecurringMatch( event, slotsWithPriority )

                    if( friendMatches.length > 0 ){
                        friendMatches.forEach(( match ) => {
                            matches.push( match )
                        })
                    }
                }
            }
        }
        return matches 
    } catch ( error ) {
        console.error( error )
    }
}

const minutesPassedInDay = ( timestamp ) => {

    const date = new Date ( timestamp )
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const totalMinutes = hours * 60 + minutes
    return totalMinutes
}

const dayOfTheWeek = ( timestamp ) => {

    const daysOfWeek = [ "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday" ]
    const date = new Date ( timestamp )
    const day = daysOfWeek[ date.getDay() ]

    return day
}

const findUniqueVsRecurringMatch = ( uniqueEvent, recurringSlotsArray ) => {
    
    const matches = []

    const eventStartMinutes = minutesPassedInDay( uniqueEvent.starts )
    const eventEndMinutes = minutesPassedInDay( uniqueEvent.ends )
    const eventDay = dayOfTheWeek( uniqueEvent.starts )

    for ( const friendSlot of recurringSlotsArray ){
        
        if( friendSlot.days.includes( eventDay )){
            const friendStart = recurringTimeToMinutes( friendSlot.startTime )
            const friendEnd = recurringTimeToMinutes( friendSlot.endTime )
            const overlap = getOverlapTime( eventStartMinutes, eventEndMinutes, friendStart, friendEnd, 60 )
    
            if( overlap ){
    
                matches.push({
                    friendSlot,
                })
            }
        }
    }

    return matches
}

const getEventInvites = async ( req, res ) => {

    try {
        const userId = req.user.uid
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in auth object.' } ) 
        }
        const invites = await getDocsWhereCondition( 'eventInvites', 'invited.userId', userId )
        if( invites ) {
            res.status( 201 ).json( invites )
        } else {
            res.status( 400 ).json( { message: 'Could not get user slots.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}


module.exports = {
    postFixedSlot,
    postAvailableNowSlot,
    postScheduledSlot,
    getUserFixedSlots,
    deleteFixedSlot,
    getAvailableNowSlots,
    getScheduledSlots,
    addNewAttendant,
    getFixedMatches,
    getEventInvites,
    handleInviteResponse
}
