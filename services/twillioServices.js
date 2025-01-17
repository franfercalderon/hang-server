const accountSID = 'ACbae5f6a5f3907e0aeb53fd32c076db5a'
const twilioToken = process.env.TWILIO_TOKEN
const twilioPhone = '+17068096056'

const client = require('twilio')( accountSID , twilioToken );

const sendText = async ( phoneNumber, message ) => {

    const text = `${ message.text } \n\nOpen the app: https://gethangapp.com${ message.url ? message.url : ''}`
    try {
        const message = await client.messages.create({
            body: text,
            from: twilioPhone,
            to: phoneNumber,
        })

        return message.sid

    } catch ( error ) {
        throw error 
    }
}

module.exports = {
    sendText,
}

