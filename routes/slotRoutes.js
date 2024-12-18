const express = require('express')
const router = express.Router()
const { postFixedSlot, postAvailableNowSlot, postScheduledSlot, getUserFixedSlots, deleteFixedSlot, getAvailableNowSlots, getScheduledSlots, addNewAttendant } = require( "../controllers/slotControllers" )
const auth = require( '../middleware/auth' )
const checkSpots = require('../middleware/checkSpots')
const checkAttending = require('../middleware/checkAttending')

//GET
router.get( '/fixed/user/:id', getUserFixedSlots )
router.get( '/now', auth, getAvailableNowSlots )
router.get( '/scheduled', auth, getScheduledSlots )

//POST
router.post( '/fixed', auth, postFixedSlot )
router.post( '/now', auth, postAvailableNowSlot )
router.post( '/schedule', auth, postScheduledSlot )
router.post( '/join', auth, checkSpots, checkAttending, addNewAttendant )

//DETELE
router.delete( '/fixed/:id', auth, deleteFixedSlot )


module.exports = router