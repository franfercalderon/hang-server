const axios = require('axios')

const getStreetViewUrl = async ( req, res ) => {

    console.log( process.env.MAPS_API_KEY )

    try {
        const { lat, lng } = req.query
        if( !lat || !lng ) {
            return res.status( 400 ).json( { message: 'Coordinates are required in request params.' } ) 
        }
        const url = `https://maps.googleapis.com/maps/api/streetview?size=${ '600x400' }&location=${ `${ lat },${ lng }` }&fov=${ 90 }&key=${ process.env.MAPS_API_KEY }`
        const response = await axios.get( url, { responseType: 'arraybuffer' })
        if ( response.status >= 200 && response.status < 300 ) {
            const imageUrl = response.config.url
            res.status( 200 ).json( imageUrl )
        } else {
            res.status( 400 ).json({ message: 'Could not retrieve requests.' })
        }
    } catch ( error ) {
        console.error( error )
        console.log(error);
        res.status( 500 ).json( error )
    }
} 

module.exports = {
    getStreetViewUrl
}