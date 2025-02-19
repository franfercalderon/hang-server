const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { redirectToGoogle, handleGoogleCallback, deleteCalendarEvent, checkCalendarConnection, disconnectCalendar } = require('../controllers/googleOAuthControllers')

//GET
router.get('/auth/google', redirectToGoogle )
router.get('/auth/google/callback', handleGoogleCallback )
router.get('/checkConnection', auth, checkCalendarConnection )

//POST
// router.post('/calendar/events', auth, createCalendarEvent )

//DELETE
router.delete('/event/:id', auth, deleteCalendarEvent )
router.delete('/auth/calendarConnection', auth, disconnectCalendar )


module.exports = router