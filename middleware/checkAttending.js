module.exports = async ( req, res, next ) => {
    
    try {
        const { data } = req.event
        const userId = req.user.uid
        const attendants = data.attending
        if( attendants.length > 0 ){
            const isUserAttending = attendants.some( item => item.userId === userId )
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