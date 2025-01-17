const { getDocAndIdWithCondition } = require('../services/firebaseServices')

module.exports = async ( req, res, next ) => {

    try {
        const userId = req.user.uid
        const { collection, eventId } = req.query

        const eventData = await getDocAndIdWithCondition( collection, 'id', eventId )
        if( eventData ){
            if( eventData.data.userId !== userId ){
                res.status( 401 ).send( { message: 'You can only delete your own events.'} )  
            } else {
                req.event = eventData
                next()
            }
        }
        
    } catch ( error ) {
        res.status( 401 ).send( { message: 'You can only delete your own events.'} ) 
    }
}