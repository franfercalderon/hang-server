const { createDocumentInCollection, updateDocumentProperties, getDocsWhereCondition, getDocIdWithCondition, deleteDocById, getDocAndIdWithCondition, updateDocArrayById, getAllDocsFromCollection } = require("../services/firebaseServices")

const addPropertyToDocs = async ( req, res ) => {

    try {

        const array = await getAllDocsFromCollection( 'users' )
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