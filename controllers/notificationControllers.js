const { createDocumentInCollection, getDocsWhereCondition, getDocIdWithCondition, deleteDocById, updateDocArrayById, updateDocumentProperties } = require("../services/firebaseServices")
const { sendEmail } = require("../services/sendgridServices")
const { sendText } = require("../services/twillioServices")
const { v4 } = require('uuid') 

const handleNotifications = async ( sender, receiverId, message, appNotification ) => {
    try {

        const timestamp = Date.now()
        const id = v4()
        const receiverResponse = await getDocsWhereCondition('users', 'id', receiverId ) 

        if ( receiverResponse.length > 0 ){
            const receiver = receiverResponse[ 0 ]
            const notification = {
                userId: receiverId,
                senderImgUrl: sender.imgUrl ? sender.imgUrl : sender.profilePhoto, 
                senderName: sender.name,
                text: message.text,
                id,
                timestamp,
                system: message.system
            }
            if( appNotification ){
                await createDocumentInCollection( 'notifications', notification )
            }
            await handleExternalNotifications( receiver, message )

        }

    } catch ( error ) {
        console.error( error )
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

const handleExternalNotifications = async ( user, message ) => {

    try {
        if( user.notifications.text ){

            const phoneNumber = user.phoneNumber
            await sendText( phoneNumber, message )
        } 
        if ( user.notifications.email ){

            const emailData = {
                emailTo: user.email,
                userName: user.name,
                subject: message.subject,
                body: message.text,
                url: message.url,
            }
            await sendEmail( emailData )
        }
        
    } catch ( error ) {
        console.error( error )
        throw error 
    }
}

const updateNotificationPreferences = async ( req, res ) => {
    try {
        const updatedPreferences = req.body
        const userId = req.user.uid

        if( !updatedPreferences  ) {
            return res.status( 400 ).json( { message: 'Updated preferences are required in request body.' } ) 
        }
        const docRef = await getDocIdWithCondition( 'users', 'id', userId )
        const updatedData = {
            notifications: updatedPreferences
        }
        if( docRef ){
            await updateDocumentProperties('users', docRef, updatedData )
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
    handleNotifications,
    getUserNotifications,
    deleteNotification,
    handleExternalNotifications,
    updateNotificationPreferences
}