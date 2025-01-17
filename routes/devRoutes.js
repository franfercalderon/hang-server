const express = require('express')
const router = express.Router()
const { addPropertyToDocs } = require( "../controllers/devControllers" )


//GET
// router.get( '/', addPropertyToDocs )

//DELETE
// router.delete( '/:id', auth, deleteNotification )

//PATCH
router.patch('/addValues', addPropertyToDocs )


module.exports = router