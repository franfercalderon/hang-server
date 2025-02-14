const { admin  } = require( '../firebase' )

const sendPushNotification = async ( message ) => {
    try {
        const response = await admin.messaging().sendMulticast( message )
        return response

    } catch ( error ) {
        console.error('Error in sendPushNotification: ', error );
    }
}

module.exports = {
    sendPushNotification
}