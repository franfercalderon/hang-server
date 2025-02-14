const { createDocumentInCollection, updateDocumentProperties, getDocsWhereCondition, getDocIdWithCondition, updateUserClaims, getDocAndIdWithCondition, updateDocArrayById } = require("../services/firebaseServices")

const handleInvitedUser = async ( req, res ) => {

    try {
        //VARIABLES
        const data = req.body
        const inviter = req.inviter
        
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'User data is required in request body.' } ) 
        }

        //GETS INFORMATION FROM INVITER USER
        const newFriend = {
            id: inviter.id,
            priority: 1
        }

        //CREATES NEW USER
        const user = {
            ...data,
            acceptedInvites: 0,
            friends: [ newFriend ],
            master: false 
        }

        const newUserId = await createUser( user )

        //GETS INVITER USER AND UPDATES SEATS AND FRIENDS
        const currentSeats =  inviter.acceptedInvites
        const updatedSeats = currentSeats + 1
        const currentFriends =  inviter.friends
        const newFriendPriority = currentFriends.length + 1 

        const friendForInviter = {
            id: user.id,
            priority: newFriendPriority
        }
        const updatedFriends = [ ...currentFriends, friendForInviter ]
    
        const inviterUpdate = {
            acceptedInvites : updatedSeats,
            friends: updatedFriends
        }
        const invitderDocRef = await getDocIdWithCondition( 'users', 'id', inviter.id )
        await updateDocumentProperties( 'users', invitderDocRef, inviterUpdate )

        if( newUserId ) {
            res.status( 201 ).json( newUserId )
        } else {
            res.status( 400 ).json( { message: 'Could not create user.' } )
        }
        
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
}

const acceptInvite = async ( req, res ) => {
    
}

const handleMasterUser = async ( req, res ) => {

    try {
        const data = req.body
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'User data is required in request body.' } ) 
        }
        const user = {
            ...data,
            acceptedInvites: 0,
            friends: [],
            master: true 
        }
    
        const newUserId = await createUser( user )
    
        if( newUserId ) {
            res.status( 201 ).json( newUserId )
        } else {
            res.status( 400 ).json( { message: 'Could not create user.' } )
        }
        
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }

}

const createUser = async ( user ) => {
    try {
        const docId = await createDocumentInCollection( 'users', user )
        return docId
    } catch ( error ) {
        throw error 
    }
} 

const updateUser = async ( req, res ) => {
    try {
        const data = req.body
        const docId = req.params.id
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'User data is required in request body.' } ) 
        } else if( !docId ){
            return res.status( 400 ).json( { message: 'DocId is required in request params.' } ) 
        }
        await updateDocumentProperties( 'users', docId, data )
        res.status( 200 ).json( { message: 'User updated.' } )
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
} 

const updateUserWithAuth = async ( req, res ) => {
    try {
        const data = req.body
        const { uid } = req.user
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'User data is required in request body.' } ) 
        } else if( !uid ){
            return res.status( 400 ).json( { message: 'User ID is required in auth object.' } ) 
        }
        const userRef = await getDocIdWithCondition( 'users', 'id', uid ) 
        await updateDocumentProperties( 'users', userRef, data )
        res.status( 200 ).json( { message: 'User updated.' } )
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
} 

const getUser = async ( req, res ) => { 
    try {
        const userId = req.user.uid
        if( !userId ) {
            return res.status( 400 ).json( { message: 'Could not get User ID from auth token.' } ) 
        }
    
        const user = await getDocsWhereCondition( 'users', 'id', userId )
        if ( user ){
            res.status( 200 ).json( user[ 0 ] )
        } else {
            res.status( 400 ).json({ message: 'User not found.' })
        }
        
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}


const acceptInvitation = async ( req, res ) => {
    try {
        const friendId = req.params.friendId
        const userId = req.user.uid

        if( !friendId ){
            return res.status( 400 ).json( { message: 'FriendId is required in request params.' } ) 
        }

        const friend = await getDocAndIdWithCondition( 'users', 'id', friendId )
        const user = await getDocAndIdWithCondition( 'users', 'id', userId )

        if( friend && user ){

            //ADDS FRIEND TO USER
            const newFriend = {
                id: friendId,
                priority: user.data.friends.length + 1
            }
            const userUpdatedFriends = [ ...user.data.friends, newFriend ]
            const newData = {
                friends: userUpdatedFriends
            }
            await updateDocumentProperties( 'users', user.docId, newData )

            //ADDS USER TO FRIEND
            const userAsFriend = {
                id: userId,
                priority: friend.data.friends.length + 1
            }
            const friendUpdatedFriends = [ ...friend.data.friends, userAsFriend ]
            const friendData = {
                friends: friendUpdatedFriends
            }
            await updateDocumentProperties( 'users', friend.docId, friendData )


            res.status( 200 ).json( { message: 'User updated.' } )

        } else {
            res.status( 400 ).json( { message: 'Update not processed.' } )
        }
        
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
} 

const postFCMToken = async ( req, res ) => {

    try {
        const userId = req.user.uid
        const data = req.body
        const newToken = data.FCMToken
    
        if( !userId ){
            res.status( 400 ).json( { message: 'userId missing in auth object.' } )
        }
        if( !data ){
            res.status( 400 ).json( { message: 'FCM token missing in requeest body' } )
        }
    
        //CHECKS EXISTING TOKENS FOR USER:
        const userTokensDoc = getDocsWhereCondition( 'FCMTokens', 'userId', userId )
        console.log('ladygaga ',userTokensDoc.length )
        if( userTokensDoc.length > 0 ){
            const docId = await getDocIdWithCondition('FCMTokens', 'userId', userId )
            if( docId ){
                await updateDocArrayById('FCMTokens', docId, 'tokens', newToken )
                res.status( 201 ).json({ message: 'Tokens stored!' })
            }
        } else {
            const newDoc = {
                userId: userId,
                tokens: [ newToken ]
            }
            await createDocumentInCollection('FCMTokens', newDoc )
            res.status( 201 ).json({ message: 'Tokens stored!' })
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }

}

module.exports = {
    handleMasterUser,
    handleInvitedUser,
    getUser,
    updateUser,
    updateUserWithAuth,
    acceptInvitation,
    postFCMToken
}
