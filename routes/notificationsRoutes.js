const express = require('express')
const router = express.Router()
const { getUserNotifications, deleteNotification } = require( "../controllers/notificationControllers" )
const auth = require( '../middleware/auth' )

//GET
router.get( '/', auth, getUserNotifications )

//DELETE
router.delete( '/:id', auth, deleteNotification )


module.exports = router