const { handleMasterUser } = require('../controllers/userControllers')
const { getDocsWhereCondition } = require('../services/firebaseServices')

module.exports = async ( req, res, next ) => {

    const masterToken = req.get('MasterToken')
    const matchingTokens = await getDocsWhereCondition( 'masterTokens', 'token', masterToken )
    if( matchingTokens.length > 0 ){
        try {
            await handleMasterUser( req, res )
            return
        } catch ( error ) {
            res.status( 500 ).send( 'Something went wrong' ) 
        }
    } else {
        next() 
    }
}