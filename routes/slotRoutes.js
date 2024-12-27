const express = require('express')
const router = express.Router()
const { postFixedSlot, postAvailableNowSlot, postScheduledSlot, getUserFixedSlots, getEventInvites, deleteFixedSlot, handleInviteResponse, getAvailableNowSlots, getScheduledSlots, addNewAttendant, getFixedMatches } = require( "../controllers/slotControllers" )
const auth = require( '../middleware/auth' )
const checkSpots = require('../middleware/checkSpots')
const checkAttending = require('../middleware/checkAttending')

//GET
router.get( '/fixed/user/:id', getUserFixedSlots )
router.get( '/now', auth, getAvailableNowSlots )
router.get( '/scheduled', auth, getScheduledSlots )
router.get( '/matches/fixed', auth, getFixedMatches )
router.get( '/invites', auth, getEventInvites )

//POST
router.post( '/fixed', auth, postFixedSlot )
router.post( '/now', auth, postAvailableNowSlot )
router.post( '/schedule', auth, postScheduledSlot )
router.post( '/join', auth, checkSpots, checkAttending, addNewAttendant )
router.post( '/invite/:id', auth, handleInviteResponse )

//DETELE
router.delete( '/fixed/:id', auth, deleteFixedSlot )


module.exports = router