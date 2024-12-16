const { getDocsWhereCondition } = require('../services/firebaseServices')

module.exports = async ( req, res, next ) => {

    const requesterId = req.user.uid
    const { receiverId } = req.body

    if( !requesterId || !receiverId ){
        res.status( 401 ).send( 'requester ID and receiver ID are required.' )  
    } else{
        try {
            const sentInvites = await getDocsWhereCondition('friendshipRequests', 'requesterId', requesterId )
            if( sentInvites.length > 0 ){
                const matches = sentInvites.filter(( invite ) => invite.receiverId === receiverId )
                if( matches.length > 0 ){
                    res.status( 401 ).send( { message: 'You have already sent an invite to this user.'} )   
                } else {
                    next()
                }
            } else {
                next()
            }

        } catch (error) {
            res.status( 401 ).send( { message: 'Could not post invitation'} ) 
        }
    }
}