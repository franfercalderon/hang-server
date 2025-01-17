const sg_template_id = process.env.SENDGRID_TEMPLATE_ID

const sgMail = require('@sendgrid/mail')

sgMail.setApiKey( process.env.SENDGRID_API_KEY )

const sendEmail = async ( emailData ) => {

    const url = `https://gethangapp.com${ emailData.url ? emailData.url : ''}`

    const message = {
        to: emailData.emailTo,
        from: {
            name: 'Hang App',
            email: 'hey@gethangapp.com',
        },
        templateId: sg_template_id,
        dynamicTemplateData: {
            msg_subject: emailData.subject,
            msg_preheader: 'Hang notifications',
            user_name: emailData.userName,
            msg_body: emailData.body,
            msg_url: url
        }
    }
    try {
        await sgMail.send( message )

    } catch ( error ) {
        throw error 
    }
}

module.exports = {
    sendEmail,
}

