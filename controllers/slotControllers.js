const { createDocumentInCollection, updateDocumentProperties, getDocsWhereCondition, getDocIdWithCondition, deleteDocById } = require("../services/firebaseServices")
const { v4 } = require('uuid') 

const postFixedSlot = async ( req, res ) => {
    try {
        const data = req.body
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'Slot data is required in request body.' } ) 
        }
        const slot = {
            ...data,
            userId: req.user.uid,
            id: v4()
        }
        const docId = await createDocumentInCollection( 'fixedSlots', slot )
        if( docId ) {
            res.status( 201 ).json( docId )
        } else {
            res.status( 400 ).json( { message: 'Could not post slot.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const postAvailableNowSlot = async ( req, res ) => {
    try {
        const data = req.body
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'Slot data is required in request body.' } ) 
        }
        const slot = {
            ...data,
            userId: req.user.uid,
            id: v4()
        }
        const docId = await createDocumentInCollection( 'availableNowSlots', slot )
        if( docId ) {
            res.status( 201 ).json( docId )
        } else {
            res.status( 400 ).json( { message: 'Could not post slot.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const postScheduledSlot = async ( req, res ) => {
    try {
        const data = req.body
        if( !data || Object.keys( data ).length === 0 ) {
            return res.status( 400 ).json( { message: 'Slot data is required in request body.' } ) 
        }
        const slot = {
            ...data,
            userId: req.user.uid,
            id: v4()
        }
        const docId = await createDocumentInCollection( 'scheduledSlots', slot )
        if( docId ) {
            res.status( 201 ).json( docId )
        } else {
            res.status( 400 ).json( { message: 'Could not post slot.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const getUserFixedSlots = async ( req, res ) => {

    try {
        const userId = req.params.id
        if( !userId  ) {
            return res.status( 400 ).json( { message: 'User ID is required in request params.' } ) 
        }
        const slots = await getDocsWhereCondition('fixedSlots', 'userId', userId )
        if( slots ) {
            res.status( 201 ).json( slots )
        } else {
            res.status( 400 ).json( { message: 'Could not get user slots.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

const deleteFixedSlot = async ( req, res ) => {

    try {
        const slotId = req.params.id
        if( !slotId  ) {
            return res.status( 400 ).json( { message: 'Slot ID is required in request params.' } ) 
        }
        const docRef = await getDocIdWithCondition('fixedSlots', 'id', slotId )
        if( docRef ){
            await deleteDocById( 'fixedSlots', docRef )
            res.status( 200 ).json( { message: 'Slot deleted.' } )
        } else {
            res.status( 400 ).json( { message: 'Could not delete.' } )
        }
    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}

module.exports = {
    postFixedSlot,
    postAvailableNowSlot,
    postScheduledSlot,
    getUserFixedSlots,
    deleteFixedSlot
}