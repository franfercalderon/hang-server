const { deleteAuthUser, getDocsWhereCondition } = require('../services/firebaseServices')

module.exports = async ( req, res, next ) => {

    const userId = req.body.id
    try {
        const inviterId = req.get( 'InviteId' )  

        if( !inviterId ){
            await deleteAuthUser( userId )
            res.status( 401 ).send( 'An invitation is required to proceed' )  
        } else {
            const res = await getDocsWhereCondition('users', 'id', inviterId )
            const inviterUser = res[ 0 ]
            if( inviterUser ){
                
                const usedSeats = inviterUser.acceptedInvites
                if ( usedSeats < 11 ) {

                    req.inviter = inviterUser
                    next()
                } else {
                    res.status( 401 ).send( 'Invite quota exceeded' )  
                }
            } else {
                await deleteAuthUser( userId )
                res.status( 401 ).send( 'Origin Account Not Found' )  
            }
        }

    } catch ( err ){
        await deleteAuthUser( userId )
        res.status( 401 ).send( 'Invalid Invitation' ) 
    }
}