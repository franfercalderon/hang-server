const { createDocumentInCollection, updateDocumentProperties, getDocsWhereCondition, getDocIdWithCondition } = require("../services/firebaseServices")

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


module.exports = {
    handleMasterUser,
    handleInvitedUser,
    getUser,
    updateUser,
    updateUserWithAuth,
}
