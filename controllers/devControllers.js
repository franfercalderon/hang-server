const { messaging } = require("firebase-admin");
const { createDocumentInCollection, updateDocumentProperties, getDocsWhereCondition, getDocIdWithCondition, deleteDocById, getDocAndIdWithCondition, updateDocArrayById, getAllDocsFromCollection } = require("../services/firebaseServices")
const { converTimestampToString , formatTimestampToDate } = require('../controllers/slotControllers')
// const getDaySuffix = ( day ) => {
//     if (day >= 11 && day <= 13) return "th"
//     switch (day % 10) {

//         case 1: return "st"
//         case 2: return "nd"
//         case 3: return "rd"
//         default: return "th"
//     }
// }

// const formatTimestampToDate = ( timestamp )  => {

//     const date = new Date( timestamp )
//     const monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ]
    
//     const day = date.getDate()
//     const daySuffix = getDaySuffix( day )
    
//     return `${ monthNames[ date.getMonth() ]} ${ day }${ daySuffix }`
// }

const addPropertyToDocs = async ( req, res ) => { 

    try {

        // const events = await getDocsWhereCondition('scheduledSlots', 'userId', 'V20Lf5TIOrN0LVRLkzUBPQVmXnM2')
        // if( events ){
        //         res.status( 200 ).json( events )
        // } else {
        //     res.status( 400 ).json( { message: 'No events'} )
        // }

        //THIS EVENT STARTS AT 4 PM CHICAGO TIME, AND TIMESTAMP IS STORED IN UTC. WHEN I FORMAT IT BACK TO CHICAGO TIMEZONE, I GET 7PM?

        // const event = {
        //     starts: 1738360800000,
        //     ends: 1738371600000,
        // }

        const rawDate = new Date( 1738368000000 )
        const formattedStart = converTimestampToString( 1738368000000 )
        // const formattedEnd = converTimestampToString( event.ends )

        const formattedDate = formatTimestampToDate( 1738368000000 )

        console.log( 'Raw Date ', rawDate);
        console.log('Formatted ', `${formattedDate} at ${formattedStart}.` );

        res.status( 200 ).json( {message: 'Ok'} )


        // const users = await getAllDocsFromCollection('users')

        // if( users.length > 0 ){
        //     res.status( 200 ).json( users )
        // } else {
        //     res.status( 400 ).json( { message: 'No users'} )
        // }
        // const darby = await getDocAndIdWithCondition('users', 'id', 'V20Lf5TIOrN0LVRLkzUBPQVmXnM2')
        // if( darby ){
        //      res.status( 200 ).json( darby )
        // } else {
        //     res.status( 400 ).json( { message: 'No users'} )
        // }

        

        // const events = await getAllDocsFromCollection( 'availableNowSlots' ) 
        // if( events.length > 0 ){
        //     // const filteredEvents = events.filter(( event ) => event.isPrivate === true )
        //     // console.log(filteredEvents.length);
        //     let added = 0

        //     for ( const event of events ){

        //         console.log('adding ', event.id);
                
        //         const docId = await getDocIdWithCondition('availableNowSlots', 'id', event.id )
        //         if( docId ){
        //             const data = {
        //                 attending: [],
        //                 availableNow: true
        //             }
        //             await updateDocumentProperties('availableNowSlots', docId, data )
                    
        //             console.log('updated: ', docId );
        //             added += 1
        //         } 
        //     }
        //     if( events.length === added ){
        //         res.status( 200 ).json({ message: 'All events updated' })

        //     } else {
        //     res.status( 400 ).json({ message: 'Some events were not updated' })

        //     }
        // } else {
        //     res.status( 400 ).json({ message: 'No events found' })
        // }

        // console.log('largo array: ', array.length);
        // const hasProperty = []
        // const doesntHave = []
        // for ( const item of array ){
        //     if( item.id ){
        //         hasProperty.push( item )
        //     } else {
        //         doesntHave.push( item )
        //     }
        // }
        // res.status( 200 ).json({
        //     arrayLength: array.length,
        //     hasProperty: hasProperty.length,
        //     doesntHave: doesntHave
        // })
        // for ( const item of array ){
        //     const notifications = {
        //         notifications:{
        //             text: true,
        //             email: false 
        //         }
        //     }
        //     const docId = await getDocIdWithCondition('users', 'id', item.id )
        //     if( docId ){
        //         console.log('updated: ', docId );
        //         await updateDocumentProperties('users', docId, notifications )
        //     } 
        // }
        // res.status( 200 ).json( { message: 'All documents from collection updated.' } )
        
    } catch ( error ) {
        console.log( error )
        res.status( 500 ).json( { message: 'Internal server error.' } )
    }
}


module.exports = {
    addPropertyToDocs,

}