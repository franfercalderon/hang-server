const express = require('express')
const router = express.Router()
const { handleInvitedUser, updateUser, getUser, updateUserWithAuth, updateUser2 } = require("../controllers/userControllers")
const { getFriendSuggestions } = require( "../controllers/friendControllers" )
const invite = require('../middleware/invite')
const auth = require('../middleware/auth')
const masterUser = require('../middleware/masterUser')

//GET
router.get('/', auth, getUser )
router.get('/explore', auth, getFriendSuggestions )

//POST
router.post('/', masterUser, invite, handleInvitedUser )

//PATCH
router.patch('/:id', auth, updateUser )
router.patch('/', auth, updateUserWithAuth )



module.exports = router