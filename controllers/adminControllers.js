const { getAllDocsFromCollection } = require("../services/firebaseServices")

const getMasterToken = async ( req, res ) => {
    try {
        const tokens = await getAllDocsFromCollection('masterTokens')
        const maxRandom = tokens.length - 1
        const randomPosition = Math.floor( Math.random() *  maxRandom )
        const randomToken = tokens[ randomPosition ]
        if( randomToken ){
            res.status( 200 ).json( randomToken.token )
        } else {
            res.status( 400 ).json({ message: 'Could not get masterToken.' })
        }

    } catch ( error ) {
        console.error( error )
        res.status( 500 ).json( 'Internal server error.' )
    }
}

module.exports = {
    getMasterToken
}