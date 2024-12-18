const { createDocumentInCollection, getDocsWhereCondition, getDocIdWithCondition, deleteDocById } = require("../services/firebaseServices")
const { v4 } = require('uuid') 

const postNotification = async ( data ) => {
    try {
        const notification = {
            userId: data.userId,
            senderImgUrl: data.userImg,
            senderName: data.name,
            text: data.text,
            timestamp: Date.now(),
            id: v4()
        }

        const docId = await createDocumentInCollection( 'notifications', notification )
        return docId

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
}

const getUserNotifications = async ( req, res ) => {

    try {
        const userId = req.user.uid
        if( !userId ) {
            return res.status( 400 ).json( { message: 'Could not get User ID from auth object.' } ) 
        }
        const notifications = await getDocsWhereCondition( 'notifications', 'userId', userId )
        if ( notifications ){
            res.status( 200 ).json( notifications )
        } else {
            res.status( 400 ).json({ message: 'Could not retrieve notifications.' })
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
}

const deleteNotification = async ( req, res ) => {
    try {
        const notificationId = req.params.id
        if( !notificationId  ) {
            return res.status( 400 ).json( { message: 'Notification ID is required in request params.' } ) 
        }
        const docRef = await getDocIdWithCondition('notifications', 'id', notificationId )
        if( docRef ){
            await deleteDocById( 'notifications', docRef )
            res.status( 200 ).json( { message: 'Notification deleted.' } )
        } else {
            res.status( 400 ).json( { message: 'Could not delete.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

module.exports = {
    postNotification,
    getUserNotifications,
    deleteNotification
}