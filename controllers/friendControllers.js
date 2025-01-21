const { createDocumentInCollection, updateDocumentProperties, getDocsWhereCondition, getDocIdWithCondition, deleteDocById, getDocAndIdWithCondition, updateDocArrayById, replaceDocArrayById } = require("../services/firebaseServices")
const { v4 } = require('uuid') 
const { handleExternalNotifications } = require("./notificationControllers")

const getUserFriends = async ( req, res ) => {

    try {
        const userId = req.user.uid
        if( !userId ) {
            return res.status( 400 ).json( { message: 'Could not get User ID from auth object.' } ) 
        }
        const response = await getDocsWhereCondition( 'users', 'id', userId )
        const user = response[ 0 ]
        const userFriends = user.friends 
        const friendsData = []
        for ( const friend of userFriends ){
            const friendRes = await getDocsWhereCondition('users', 'id', friend.id )
            if ( friendRes.length > 0 ) {
                const friendDetail = {
                    name: friendRes[ 0 ].name,
                    lastname: friendRes[ 0 ].lastname,
                    id: friendRes[ 0 ].id,
                    imgUrl: friendRes[ 0 ].profilePhoto ? friendRes[ 0 ].profilePhoto : null ,
                }
                friendsData.push( friendDetail )
            }
        }
        if ( friendsData ){
            res.status( 200 ).json( friendsData )
        } else {
            res.status( 400 ).json({ message: 'Could not retrieve friends.' })
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
}

const getFriendSuggestions = async ( req, res ) => {
    try {
        const userId = req.user.uid
        if( !userId ) {
            return res.status( 400 ).json( { message: 'Could not get User ID from auth object.' } ) 
        }

        //GETS USER FRIENDS
        const response = await getDocsWhereCondition( 'users', 'id', userId )
        const user = response[ 0 ]
        const userFriends = user.friends 
        const friendsFromFriends = []


        //LOOPS OVER USER FRIENDS TO GET THEIR FRIENDS
        for ( const friend of userFriends ){

            const userFriend = await getDocsWhereCondition( 'users', 'id', friend.id )

            if ( userFriend.length > 0 ) {

                const userFriendFriends = userFriend[ 0 ].friends

                if ( userFriendFriends.length > 0 ){

                    for( const subFriend of userFriendFriends ){
    
                        const secondGradeFriend = await getDocsWhereCondition('users', 'id', subFriend.id )
                        const friendDetail = {
                            name: secondGradeFriend[ 0 ].name,
                            lastname: secondGradeFriend[ 0 ].lastname,
                            id: secondGradeFriend[ 0 ].id,
                            imgUrl: secondGradeFriend[ 0 ].profilePhoto ? secondGradeFriend[ 0 ].profilePhoto : null ,
                        } 

                        //CHECKS IF ITEM IS NOT IN ARRAY (REPEATED FRIEND) AND THEN ADDS IT
                        const exists = friendsFromFriends.some( ( item ) => item.id === friendDetail.id )
                        if ( !exists ){
                            friendsFromFriends.push( friendDetail )
                        }
                    }
                }
            }
        }
        
        //FILTER FRIENDS THAT MIGHT BE FRIENDS WITH USER ALREADY
        const filteredSuggestions = []
        
        friendsFromFriends.forEach(( newFriend ) => {
            const exists = userFriends.some( ( item ) => item.id === newFriend.id )
            if( !exists ){
                filteredSuggestions.push( newFriend )
            }
        })
        
        //EXCLUDES USER FROM RESULTS
        const finalFilteredSuggestions = filteredSuggestions.filter(( friend ) => friend.id !== userId )

        //RETURNS
        if ( finalFilteredSuggestions ){
            res.status( 200 ).json( finalFilteredSuggestions )
        } else {
            res.status( 400 ).json({ message: 'Could not retrieve friends.' })
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
}

const postFriendshipRequest = async ( req, res ) => {

    try {
        
        const requesterId = req.user.uid
        const { receiverId, requesterProfilePicture, requesterName, requesterLastame } = req.body
    
        if( !requesterId || !receiverId ) {
            return res.status( 400 ).json( { message: 'Both requesterId and receiverId are required.' } ) 
        }
    
        const friendShipRequest = {
            requesterId,
            receiverId,
            requesterProfilePicture,
            requesterName,
            requesterLastame,
            id: v4(),
            status: 'pending',
            timestamp: Date.now()
        }
    
        const requestId = await createDocumentInCollection( 'friendshipRequests', friendShipRequest ) 
        const receiverResponse = await getDocsWhereCondition( 'users', 'id', receiverId )

        if( receiverResponse.length > 0 ){
            const receiverUser = receiverResponse[ 0 ]
            const notificationText = `${ requesterName } ${ requesterLastame } wants to be your friend in Hang.`
            await handleExternalNotifications( receiverUser, notificationText, 'New friends request' )
        }
    
        if ( requestId ){
            res.status( 200 ).json( requestId )
        } else {
            res.status( 400 ).json({ message: 'Could not post request.' })
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }    
}

const getFriendshipRequests = async ( req, res ) => {

    try {
        const userId = req.user.uid
        if( !userId ) {
            return res.status( 400 ).json( { message: 'Could not get User ID from auth object.' } ) 
        }
        const requests = await getDocsWhereCondition( 'friendshipRequests', 'receiverId', userId )
        if ( requests ){
            const pendingRequests = requests.filter(( request ) => request.status === 'pending')
            res.status( 200 ).json( pendingRequests )
        } else {
            res.status( 400 ).json({ message: 'Could not retrieve requests.' })
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
} 

const replyFriendsRequest = async ( req, res ) => {
    try {
        const userId = req.user.uid
        const { requestId, accepted, requesterId, invitedFriendsLength } = req.body

        if( !userId ) {
            return res.status( 400 ).json( { message: 'Could not get User ID from auth object.' } ) 
        } else if ( !requestId ){
            return res.status( 400 ).json( { message: 'Request ID is required.' } ) 
        }

        const requestRef = await getDocIdWithCondition( 'friendshipRequests', 'id', requestId )
        const data = {
            status: accepted ? 'accepted' : 'denied'
        }
        await updateDocumentProperties( 'friendshipRequests', requestRef, data )
        if ( accepted ){

            const invitedId = await getDocIdWithCondition('users', 'id', userId )
            const requesterFriend = {
                id: requesterId,
                priority: invitedFriendsLength + 1
            }
            await updateDocArrayById( 'users', invitedId, 'friends', requesterFriend )

            const inviterObject = await getDocAndIdWithCondition('users', 'id', requesterId )
            const inviterFriendsLength = inviterObject.data.friends.length
            const meAsAFriend = {
                id: userId,
                priority: inviterFriendsLength + 1
            }
            await updateDocArrayById( 'users', inviterObject.docId, 'friends', meAsAFriend )        

            res.status( 200 ).json( 'Request accepted' )
        } else {
            res.status( 200 ).json( 'Request denied' )
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
}

const deleteFriend = async ( req, res ) => {
    try {
        const friendId = req.params.id
        const userId = req.user.uid 
        if( !friendId ){
            return res.status( 400 ).json( { message: 'Friend ID is required in request url.' } ) 
        }

        const user = await getDocAndIdWithCondition('users', 'id', userId )
        const friend = await getDocAndIdWithCondition('users', 'id', friendId )
        if( user && friend ){
            //DELETE FRIEND FROM USERS LIST
            const userFriends = user.data.friends
            const friendFriends = friend.data.friends
            
            const updatedUserFriends = userFriends.filter(( friend ) => friend.id !== friendId )
            const updatedFriendFriends = friendFriends.filter(( friend ) => friend.id !== userId )

            if( userFriends.length - updatedUserFriends.length === 1 && friendFriends.length - updatedFriendFriends.length ){

                await replaceDocArrayById('users', user.docId, 'friends', updatedUserFriends )
                await replaceDocArrayById('users', friend.docId, 'friends', updatedFriendFriends )
                
                res.status( 200 ).json( { message: 'Friend deleted' } )
            } else {
                res.status( 400 ).json( { message: 'Could not complete the operation' } )
            }
            
        } else {
            res.status( 400 ).json( { message: 'Could not complete the operation' } )

        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
}

module.exports = {
    getUserFriends,
    getFriendSuggestions,
    postFriendshipRequest,
    getFriendshipRequests,
    replyFriendsRequest,
    deleteFriend

}