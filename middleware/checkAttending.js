module.exports = async ( req, res, next ) => {
    console.log(req.event);

    try {
        if( req.limitedSeats ){
            const { data } = req.event
            const userId = req.user.uid
            const attendants = data.attending
            const isUserAttending = attendants.some( item => item.id === userId )
            if( isUserAttending ){ 
                res.status( 401 ).send( { message: 'You are part of this event already.'} )
            } else {
                next()
            }
        } else {
            next()
        }
    } catch (error) {
        res.status( 401 ).send( { message: 'Error getting event'} ) 
    }
}