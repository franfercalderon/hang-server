const express = require('express')
const router = express.Router()
const { getUserNotifications, deleteNotification, handleExternalNotifications, updateNotificationPreferences, testPushNotification } = require( "../controllers/notificationControllers" )
const auth = require( '../middleware/auth' )

//GET
router.get( '/', auth, getUserNotifications )

//DELETE
router.delete( '/:id', auth, deleteNotification )

//PATCH
router.patch('/updatePreferences', auth, updateNotificationPreferences )

//POST
router.post('/test', handleExternalNotifications )
router.post('/push', auth, testPushNotification )


module.exports = router