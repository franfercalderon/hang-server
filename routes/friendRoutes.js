const express = require('express')
const router = express.Router()
const { getUserFriends, getFriendSuggestions, postFriendshipRequest, getFriendshipRequests, replyFriendsRequest, deleteFriend } = require("../controllers/friendControllers")
// const invite = require('../middleware/invite')
const auth = require('../middleware/auth')
const existingInvite = require('../middleware/existingInvite')
// const masterUser = require('../middleware/masterUser')

//GET
router.get('/all', auth, getUserFriends )
router.get('/explore', auth, getFriendSuggestions )
router.get('/requests', auth, getFriendshipRequests )

//POST
router.post('/friendshipRequest', auth, existingInvite, postFriendshipRequest )

//PATCH
router.patch('/friendshipRequest', auth, replyFriendsRequest )

//DELETE
router.delete('/:id', auth, deleteFriend )


module.exports = router