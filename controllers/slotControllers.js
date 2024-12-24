const { createDocumentInCollection, getDocsWhereCondition, getDocIdWithCondition, deleteDocById, updateDocArrayById } = require("../services/firebaseServices")
const { v4 } = require('uuid') 
const { postNotification } = require("./notificationControllers")

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
                        const attendants = act.attending.length
                        const eventSeats = act.spots
                        if( attendants < eventSeats ){
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
            text: req.limitedSeats ? 'wants to join your Hang' : 'wants to meet you now',
            userId: data.userId
        }

        const notificationId = await postNotification( notification )

        if( notificationId ){
            res.status( 200 ).json( { message: 'User added to event' } )
        } else {
            res.status( 401 ).json( { message: 'Could not add user' } )
        }

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

const getOverlapTime = ( start1, end1, start2, end2 ) => {

    if ( start1 < end2 && start2 < end1 ){

        const overlapStart = Math.max( start1, start2 )
        const overlapEnd = Math.min( end1, end2 )

        const overlapDuration = overlapEnd - overlapStart

        if (overlapDuration < 60) {
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

            const overlap = getOverlapTime( userStart, userEnd, friendStart, friendEnd )

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


module.exports = {
    postFixedSlot,
    postAvailableNowSlot,
    postScheduledSlot,
    getUserFixedSlots,
    deleteFixedSlot,
    getAvailableNowSlots,
    getScheduledSlots,
    addNewAttendant,
    getFixedMatches
}
