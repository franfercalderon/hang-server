const express = require('express')
const router = express.Router()
const { getStreetViewUrl  } = require("../controllers/mapsControllers")
const auth = require('../middleware/auth')

//GET
router.get('/streetViewUrl',  getStreetViewUrl )


module.exports = router