const express = require('express')
const router = express.Router()
const { handleInvitedUser, updateUser, getUser, updateUserWithAuth, acceptInvitation } = require("../controllers/userControllers")
const { getFriendSuggestions } = require( "../controllers/friendControllers" )
const invite = require('../middleware/invite')
const auth = require('../middleware/auth')
const masterUser = require('../middleware/masterUser')

//GET
router.get('/', auth, getUser )
router.get('/explore', auth, getFriendSuggestions )

//POST
router.post('/', masterUser, invite, handleInvitedUser )
router.post('/acceptInvite/:friendId', auth, acceptInvitation )
router.post('/FCMToken', auth, postFCMToken )


//PATCH
router.patch('/:id', auth, updateUser )
router.patch('/', auth, updateUserWithAuth )



module.exports = router