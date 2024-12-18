const { getDocAndIdWithCondition } = require('../services/firebaseServices')

module.exports = async ( req, res, next ) => {

    const { event, user } = req.body
    try {
        
        if( !event || !user ){
            res.status( 401 ).send( 'Event and user are required in request body.' )  
        } 
        const eventObject = await getDocAndIdWithCondition(event.limitedSeats ?'scheduledSlots' : 'availableNowSlots', 'id', event.id )
        req.event = eventObject
        
        if( event.limitedSeats ){
            const { data } = eventObject
            const attendants = data.attending.length
            const eventSeats = data.spots
            if( attendants < eventSeats ){
                req.limitedSeats = true 
                next()

            } else {
                res.status( 401 ).send( { message: 'Sorry, event is full'} )   
            }
        } else {
            
            req.limitedSeats = false
            next()
        }

    } catch (error) {
        res.status( 401 ).send( { message: 'Error getting event'} ) 
    }
}