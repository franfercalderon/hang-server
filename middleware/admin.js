const { getDocsWhereCondition } = require('../services/firebaseServices')

module.exports = async ( req, res, next ) => {

    const userId = req.user.uid

    if( !userId  ){
        res.status( 401 ).send( { message: 'User ID is required.'} )  
    } else{
        try {
            const res = await getDocsWhereCondition('users', 'id', userId )
            const user = res[ 0 ]
            if( user.master ){
                next()
            } else {
                res.status( 401 ).send( { message: 'Function available for master users only.'} )  
            }

        } catch (error) {
            res.status( 401 ).send( { message: 'Could not check user permissions.'} ) 
        }
    }
}