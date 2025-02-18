const { createDocumentInCollection, getDocsWhereCondition, getDocIdWithCondition, deleteDocById, updateDocArrayById, getDocAndIdWithCondition, updateDocumentProperties, replaceDocArrayById, findValueInDocsArray } = require("../services/firebaseServices")
const { v4 } = require('uuid') 
const { handleNotifications } = require("./notificationControllers")
const moment = require('moment-timezone');
const { handleCalendarEvents } = require("./googleOAuthControllers");
const { deleteEventFromGoogleCalendar } = require("../services/googleOAuthServices");


const formatTimestampToDate = ( timestamp, timezone = 'America/Chicago'  )  => {

    const timeZoned = moment.utc( timestamp ).tz( timezone )
    const formattedDate = timeZoned.format('MMMM DD, YYYY')
    return formattedDate
}

const converTimestampToString = ( timestamp, timezone = 'America/Chicago' ) => {

    const current = Date.now()
    if( timestamp < current ){
        return 'now'

    } else {
        const timeZoned = moment.utc( timestamp ).tz( timezone ) 
        const timeZoneDate = timeZoned.format( 'h:mm a' )

        return timeZoneDate 
    }
}

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
            attending: [],
            availableNow: true,
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
        const userId = req.user.uid
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'Slot data is required in request body.' } ) 
        }
        const slot = {
            ...data,
            userId: userId,
            id: v4()
        }
        const docId = await createDocumentInCollection( 'scheduledSlots', slot )
        if( docId ) {
            res.status( 201 ).json( docId )

            handleCalendarEvents( userId, slot, docId ).catch( error => {

                console.error( 'Error executing handleCalendarEvents:', error )
            })

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

            const filteredActivity = currentActivity.filter(( event ) => 

                !event.attending.some(( user ) => user.userId === userId )
            )
    
            if( filteredActivity ) {
                res.status( 201 ).json( filteredActivity )
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
            
            const filteredActivity = currentActivity.filter(( event ) => 

                !event.attending.some(( user ) => user.userId === userId )
            )
    
            if( filteredActivity ) {
                res.status( 201 ).json( filteredActivity )
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
        const collection = req.collection

        const joiningUser = {
            userId: authUser.uid,
            userImg: user.imgUrl,
            name: user.name,
            lastname: user.lastname
        }

        await updateDocArrayById( collection, docId, 'attending', joiningUser )

        const sender = {
            imgUrl: user.imgUrl,
            name: user.name,
            lastname: user.lastname
        }
        const message = {
            system: false,
            text: `${ user.name } ${ user.lastname } has joined your Hang ${ data.title ? `'${ data.title }'.` : '.'}`,
            subject: 'Someone has joined your Hang!', 
            url: '/notifications'
        }

        const pushMessage = {
            title: 'Someone Joined Your Hang!',
            body: `${ user.name } ${ user.lastname } just joined ${ data.title ? `'${ data.title }'` : ''}. Get ready to Hang!`
        }

        res.status( 200 ).json( { message: 'User added to event' } )
        handleNotifications( sender, data.userId, message, true, pushMessage ).catch( error => {

            console.error( 'Error executing handleNotifications:', error )
        })
        
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

        if( event.visibility === 'auto'){

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

                const invitedId = match.friendSlot.userId
    
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
                        userId: invitedId
                    }
                }
                //CREATE INVITE IN APP
                await createDocumentInCollection( 'eventInvites' , invite )
                
                //NOTIFICATIONS
                const sender = {
                    imgUrl: event.userImg,
                    name: event.userName,
                    lastname: event.userLastname
                }
                const message = {
                    system: false,
                    text: `${ event.userName } ${ event.userLastname } is organizing ${ event.title ? `'${ event.title }'` : 'a Hang'} at ${ event.location.address }. Date: ${ formatTimestampToDate( event.starts ) } from ${ converTimestampToString( event.starts ) } to ${ converTimestampToString( event.ends ) }.`,
                    subject: 'Your friend is hosting a Hang you can attend!',
                    url: '/notifications'
                }

                const pushMessage = {
                    title: 'New Hang you can attend!',
                    body: `${ event.userName } ${ event.userLastname } is organizing ${ event.title ? `'${ event.title }'` : 'a Hang'}.`
                }

                await handleNotifications( sender, invitedId, message, false, pushMessage )
    
            }
    
            const updatedArray = sortedMatches.map( item => usersToNotify.some( user => user.friendSlot.id === item.friendSlot.id ) ? { ...item, friendSlot: { ...item.friendSlot, status: 'pending' } } : item )
    
            await replaceDocArrayById( 'invitePool', poolId, 'sortedMatches', updatedArray )

        } else if ( event.visibility === 'custom' ){

            for ( const friend of event.customList ){

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
                        userId: friend.id
                    }
                }
                //CREATE INVITE IN APP
                await createDocumentInCollection( 'eventInvites' , invite )
                
                //NOTIFICATIONS
                const sender = {
                    imgUrl: event.userImg,
                    name: event.userName,
                    lastname: event.userLastname
                }
                const message = {
                    system: false,
                    text: `${ event.userName } ${ event.userLastname } is organizing ${ event.title ? `'${ event.title }'` : 'an event'} at ${ event.location.address }. Date: ${ formatTimestampToDate( event.starts ) } from ${ converTimestampToString( event.starts ) } to ${ converTimestampToString( event.ends ) }.`,
                    subject: 'Your friend is inviting you to a Hang!',
                    url: '/notifications'
                }
                const pushMessage = {
                    title: `You're Invited to a New Hang!`,
                    body: `${ event.userName } ${ event.userLastname } invited you to ${ event.title ? `'${ event.title }'` : 'a Hang'}.`
                }

                await handleNotifications( sender, friend.id, message, false, pushMessage )

            }
        }

        
    } catch ( error ) {
        console.error( error )
    }
}

const handleInviteResponse = async ( req, res ) => {

    const invitedId = req.user.uid
    const eventId = req.params.id
    const { accepted, userData, collection } = req.body

    if( !userData || !collection ){
        return res.status( 400 ).json( 'Data missing in request body' )
    }
    console.log('collection: ', collection);
    console.log('eventId: ', eventId);

    // const { data, docId } = await getDocAndIdWithCondition( collection, 'id', eventId )
    const resposne = await getDocsWhereCondition( collection, 'id', eventId )
    console.log(resposne);
    console.log(data);
    console.log(docId);
    const inviterId = data.userId

    let poolResponse
    let poolDocId

    if( data.visibility === 'auto'){

        //UPDATES INVITE POOL
        poolResponse = await getDocAndIdWithCondition( 'invitePool', 'event.id', eventId )
        if( poolResponse ){
            poolDocId = poolResponse.docId
        
            const updatedMatches = poolResponse.data.sortedMatches.map(( match ) => {
                if ( match.friendSlot.userId === invitedId ){
                    return { ...match, friendSlot: { ...match.friendSlot, status: accepted ? 'accepted': 'rejected' } } 
                }
                return match
            })
        
        
            await replaceDocArrayById( 'invitePool', poolDocId, 'sortedMatches', updatedMatches )
        } else {
            return res.status( 400 ).json({ message: 'Something went wrong.' })
        }
    }


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

            
            res.status( 200 ).json( 'User added to event' )
            //SENDS NOTIFICATIONS       
            const sender = {
                imgUrl: userData.img,
                name: userData.name,
                lastname: userData.lastname, 
            }     
            const message = {
                system: false ,
                text: `${ newAttendant.name } ${ newAttendant.lastname } has joined your '${ data.title }' event.`,
                subject: `You have got company! Someone is attending your Hang`,
                url:'/notifications',
            }

            const pushMessage = {
                title: `Someone Joined Your Hang!`,
                body: `${ newAttendant.name } ${ newAttendant.lastname } has joined your ${ data.title ? `'${ data.title }'` : 'Hang'}.`
            }
            
            handleNotifications( sender, inviterId, message, true, pushMessage ).catch( error => {
                console.error( 'Error executing handleNotifications:', error )
            })

            if( data.visibility === 'auto' && data.spots - attending.length === 1 ){

                const message1 = {
                    system: true ,
                    text: `Your '${ data.title }' event is full!`,
                    subject: `Congratulations! Your ${ data.title } event is full.`,
                    url:'/notifications',
                }
                const pushMessageFull = {
                    title: `Hang Full!`,
                    body: `Your ${ data.title } has reached full capacity. Time to get the party started!.`
                }

                await handleNotifications( sender, inviterId, message1, true, pushMessageFull )
            }

        } else {
            res.status( 400 ).json( 'Sorry, event is full' )
        }

    } else {

        if( data.visibility === 'auto' && data.attending.length < data.spots){

            if( poolResponse ){

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

                    //NOTIFICATIONS
                    const sender = {
                        imgUrl: invite.event.userImg,
                        name: invite.event.userName,
                        lastname: invite.event.userLastname
                    }
                    const message = {
                        system: false,
                        text: `${ invite.event.userName } ${ invite.event.userLastname } is organizing ${ invite.event.eventName ? `'${ invite.event.eventName }'` : 'an event'} at ${ invite.event.location.address }. Date: ${ formatTimestampToDate( invite.event.location.starts ) } from ${ converTimestampToString( invite.event.location.starts ) } to ${ converTimestampToString( invite.event.location.ends ) }.`,
                        subject: 'Your friend is inviting you to a Hang!',
                        url: '/notifications'
                    }

                    const pushMessage = {
                        title: `You're Invited to a New Hang!`,
                        body: `${ invite.event.userName } ${ invite.event.userLastname } invited you to ${ data.title ? `'${ data.title }'` : 'a Hang'}.`
                    } 

                    await handleNotifications( sender, invite.invited.userId, message, false, pushMessage )
    
                    const updatedMatches = matches.map(item => item.friendSlot.userId === sortedPending[0].friendSlot.userId ? { ...item, friendSlot: { ...item.friendSlot, status: 'pending' } } : item )
    
                    await replaceDocArrayById( 'invitePool', poolDocId, 'sortedMatches', updatedMatches )
    
                    
                } else {
                    res.status( 200 ).json( 'Invitation rejected' )
                }
            } else {
                res.status( 400 ).json({ message: 'Missing poolData' })
            }

        }
        res.status( 200 ).json( 'Invitation rejected' )
    }

    //DELETE USER NOTIFICATION
    const notificationId = await getDocIdWithCondition( 'eventInvites', 'invited.userId', invitedId )
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
            const currentDate = Date.now()
            const currentInvites = invites.filter(( event ) => event.event.starts > currentDate )
            res.status( 201 ).json( currentInvites )
        } else {
            res.status( 400 ).json( { message: 'Could not get user slots.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const getOwnEvents = async ( req, res ) => { 
    try {
        const userId = req.user.uid
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in auth object.' } ) 
        }
        const scheduledEvents = await getDocsWhereCondition( 'scheduledSlots', 'userId', userId )
        const nowEvents  = await getDocsWhereCondition( 'availableNowSlots', 'userId', userId )
        if( scheduledEvents && nowEvents ) {

            const allEvents = [ ...scheduledEvents, ...nowEvents ]
            const currentDate = Date.now()
            const upcomingActivity = allEvents.filter(( event ) => event.ends  > currentDate )

            res.status( 201 ).json( upcomingActivity )
        } else {
            res.status( 400 ).json( { message: 'Could not get user events.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const getAttendingEvents = async ( req, res ) => {
    try {
        const userId = req.user.uid
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in auth object.' } ) 
        }
        const scheduledEvents = await findValueInDocsArray( 'scheduledSlots', 'attending', userId )
        const nowEvents = await findValueInDocsArray( 'availableNowSlots', 'attending', userId )


        if( scheduledEvents && nowEvents ){

            const allEvents = [ ...scheduledEvents, ...nowEvents ]
            const events = []
            allEvents.forEach(( event ) => {
    
                const newEvent = {
                    title: event.title,
                    starts: event.starts,
                    ends: event.ends,
                    userId: event.userId,
                    userName: event.userName,
                    userLastname: event.userLastname,
                    userImg: event.userImg,
                    id: event.id,
                    location: event.location,
                    availableNow: event.availableNow ? true : false
                    
                }
                events.push( newEvent )
            })
            const currentDate = Date.now()
            const upcomingActivity = events.filter(( event ) => event.ends  > currentDate )
            res.status( 201 ).json( upcomingActivity )
            
        } else{
            res.status( 400 ).json( { message: 'Could not get user events.' } )
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const deleteEvent = async ( req, res ) => {
    try {
        const userId = req.user.uid
        const { data, docId } = req.event
        const { collection } = req.query
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in auth object.' } ) 
        }
        await deleteDocById( collection, docId )
        res.status( 201 ).json( { message: 'Event deleted' } )

            if( data.googleEventId ){
                deleteEventFromGoogleCalendar( userId, data.googleEventId ).catch( error => {
    
                    console.error( 'Error executing deleteEventFromGoogleCalendar:', error )
                })
            }


            if( data.attending.length > 0 ){
                const response = await getDocsWhereCondition('users', 'id', userId )
                if( response.length > 0 ){
                    const sender = response[0]
                    for( const attendant of data.attending ){
                        const attendantId = attendant.userId
                        const message = {

                            system: false,
                            text: `${ sender.name } ${ sender.lastname } has cancelled ${ data.title ? `'${ data.title }'` : 'their Hang'}, which was scheduled for ${ formatTimestampToDate( data.starts )} at ${ converTimestampToString( data.starts )}.`,
                            subject: 'A Hang has been cancelled',
                            url: '/notifications'
                        }
                        const pushMessage = {
                            title: `Attention: Hang Cancelled`,
                            body: `Unfortunately ${ sender.name } ${ sender.lastname } has cancelled ${ data.title ? `'${ data.title }'` : 'their Hang'}.`
                        }

                        await handleNotifications( sender, attendantId, message, true, pushMessage )
                    }
                }
            }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Could not delete event.' } )
    }
}

const leaveEvent = async ( req, res ) => {
    try {
        const userId = req.user.uid
        const { collection, eventId } = req.body
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in auth object.' } ) 
        } else if (!collection || !eventId ){
            return res.status( 400 ).json( { message: 'Collection and eventId are required in request params.' } ) 
        }
        const eventData = await getDocAndIdWithCondition( collection, 'id', eventId )

        if( eventData ){
            const { data, docId } = eventData
            const attendants = data.attending
            const updatedAttendants = attendants.filter(( attendant ) => attendant.userId !== userId )
            await replaceDocArrayById( collection, docId, 'attending', updatedAttendants )
            res.status( 201 ).json( { message: 'User removed' } )
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'You were not removed from Hang' } )
    }
}

const updateEvent= async ( req, res ) => {
    try {
        const userId = req.user.uid
        const { eventData, eventId } = req.body
        if( !userId  || !eventData) {
            return res.status( 400 ).json( { message: 'eventData, eventId are required in request body.' } ) 
        } 
        const collection = "scheduledSlots"
        const eventObject = await getDocAndIdWithCondition(collection, 'id', eventId )
        if( eventObject ){

            if( eventData.title ){
                const updatedValue = { title: eventData.title }
                await updateDocumentProperties( collection, eventObject.docId, updatedValue)
            }
            if( eventData.description ){
                const updatedValue = { description: eventData.description }
                await updateDocumentProperties( collection, eventObject.docId, updatedValue )
            }
            if( eventData.starts ){
                const updatedValue = { starts: eventData.starts }
                await updateDocumentProperties( collection, eventObject.docId, updatedValue)
            }
            if( eventData.ends ){
                const updatedValue = { ends: eventData.ends }
                await updateDocumentProperties( collection, eventObject.docId, updatedValue)
            }
            if( eventData.location ){
                const updatedValue = { location: eventData.location }
                await updateDocumentProperties( collection, eventObject.docId, updatedValue)
            }
            if( eventData.customList && eventData.customList.length > 0 ){

                for( const newFriend of eventData.customList ){
                    await updateDocArrayById( collection, eventObject.docId, 'customList', newFriend )
                }
            }

        }
        res.status( 200 ).json( { message: 'Event Updated' })

        if( eventData.customList && eventData.customList.length > 0 ){

            for( const newFriend of eventData.customList ){

                const invite = {
                    event: {
                        userId: eventObject.data.userId,
                        eventName: eventData.title && eventData.title !== '' ? eventData.title : eventObject.data.title,
                        starts: eventData.starts ?? eventObject.data.starts,
                        ends: eventData.ends ?? eventObject.data.ends,
                        userImg: eventObject.data.userImg,
                        userName: eventObject.data.userName,
                        userLastname: eventObject.data.userLastname,
                        collection,
                        id: eventObject.data.id,
                        location: eventData.location ?? eventObject.data.location
                    },
                    invited: {
                        userId: newFriend.id
                    }
                }
                //CREATE INVITE IN APP
                await createDocumentInCollection( 'eventInvites' , invite )
                
                //NOTIFICATIONS
                const sender = {
                    imgUrl: eventObject.data.userImg,
                    name: eventObject.data.userName,
                    lastname: eventObject.data.userLastname
                }
                const message = {
                    system: false,
                    text: `${ eventObject.data.userName } ${ eventObject.data.userLastname } is organizing ${ eventData.title && eventData.title !== '' ? eventData.title : eventObject.data.title } at ${ eventData.location?.address ?? eventObject.data.location.address }. Date: ${ formatTimestampToDate( eventData.starts ?? eventObject.data.starts ) } from ${ converTimestampToString( eventData.starts ?? eventObject.data.starts ) } to ${ converTimestampToString( eventData.ends ?? eventObject.data.ends ) }.`,
                    subject: 'Your friend is inviting you to a Hang!',
                    url: '/notifications'
                }

                const pushMessage = {
                    title: `You're Invited to a New Hang!`,
                    body: `${ eventObject.data.userName } ${ eventObject.data.userLastname } invited you to ${ eventData.title && eventData.title !== '' ? eventData.title : eventObject.data.title}.`
                } 

                await handleNotifications( sender, newFriend.id, message, false, pushMessage )
            } 

        }
        if( eventObject.data.attending && eventObject.data.attending.length > 0 ){

            for( const attendant of eventObject.data.attending ){

                //NOTIFICATIONS
                const sender = {
                    imgUrl: eventObject.data.userImg,
                    name: eventObject.data.userName,
                    lastname: eventObject.data.userLastname
                }
                const message = {
                    system: false,
                    text: `${ eventObject.data.userName } ${ eventObject.data.userLastname } has updated their event '${ eventObject.data.title }'. Check updated details in the Event section of the app.`,
                    subject: 'Attention: A Hang you are attending has changed.',
                    url: '/events'
                }
                const pushMessage = {
                    title: `Attention: Hang Details Changed.`,
                    body: `${ eventObject.data.title } has been updated. Check out new details in the app.`
                }
                await handleNotifications( sender, attendant.userId, message, true, pushMessage )
            }
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'You were not removed from Hang' } )
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
    handleInviteResponse,
    getOwnEvents,
    getAttendingEvents,
    deleteEvent,
    leaveEvent,
    updateEvent,
    converTimestampToString,
    formatTimestampToDate
}
