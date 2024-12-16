const express = require('express')
const router = express.Router()
const { getMasterToken } = require("../controllers/adminControllers")
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

//GET
router.get('/masterToken', auth, admin, getMasterToken )

module.exports = router