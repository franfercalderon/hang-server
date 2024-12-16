const express = require('express')
const router = express.Router()
const { postFixedSlot, postAvailableNowSlot, postScheduledSlot, getUserFixedSlots, deleteFixedSlot } = require("../controllers/slotControllers")
const auth = require('../middleware/auth')

//GET
router.get('/fixed/user/:id', getUserFixedSlots )

//POST
router.post('/fixed', auth, postFixedSlot )
router.post('/now', auth, postAvailableNowSlot )
router.post('/schedule', auth, postScheduledSlot )

//DETELE
router.delete('/fixed/:id', deleteFixedSlot )


module.exports = router