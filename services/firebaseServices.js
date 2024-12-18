const { FieldValue } = require('firebase-admin/firestore')
const { db, admin  } = require( '../firebase' )

//ADD DOC TO COLLECTION (RETURNS STRING - DOC ID)
const createDocumentInCollection = async ( collection, data ) => {
    try {
        const res = await db.collection( collection ).add( data )
        return res.id

    } catch ( error ) {
        if( error instanceof Error ){
            console.error(`error: ${ error.message }`) 
        }
        throw error
    }
} 

const updateDocumentProperties = async ( collection, docId, data ) => {
    try {
        const docRef = db.collection( collection ).doc( docId )
        await docRef.set( data, { merge: true })
        return 
        
    } catch  (error ) {
        if(error instanceof Error){
            console.error(`error: ${ error.message }`)
        }
        throw error
    }
} 

const getDocsWhereCondition = async ( collection, existingValue, searchValue ) => {
    try {
        const data = []
        const collectionRef = db.collection( collection )
        const query = collectionRef.where( existingValue, '==', searchValue )
        const querySnapshot = await query.get()
        querySnapshot.forEach( doc => {
            data.push( doc.data() )
        })
        return data

    } catch ( error ) {
        if(error instanceof Error){
            console.error(`error: ${error.message}`)
        }
        throw error
    }
}

const getDocByDocRef = async ( collection, docId ) => {
    try {
        const docRef = db.collection( collection ).doc( docId )
        const doc = await docRef.get()
        if( !doc.exists ) {
            return null 
        } 
        return doc.data()

    } catch (error) {
        if(error instanceof Error){
            console.error(`error: ${error.message}`)
        }
        throw error
    }
}

const deleteAuthUser = async ( uid ) => {
    try {
        await admin.auth().deleteUser( uid )
        return 
    } catch (error) {
        if(error instanceof Error){
            console.error(`error: ${error.message}`)
        }
        throw error
    }
}

const getDocIdWithCondition = async ( collection, existingValue, searchValue ) => {

    try {
        const data = []
        const collectionRef = db.collection( collection )
        const query = collectionRef.where( existingValue, '==', searchValue )
        const querySnapshot = await query.get()
        querySnapshot.forEach( doc => {
            data.push( doc.id )
        })
        const docId = data[0]
        return docId

    } catch ( error ) {
        if(error instanceof Error){
            console.error(`error: ${error.message}`)
        }
        throw error
    }
}

const getDocAndIdWithCondition = async ( collection, existingValue, searchValue ) => {

    try {
        const data = []
        const collectionRef = db.collection( collection )
        const query = collectionRef.where( existingValue, '==', searchValue )
        const querySnapshot = await query.get()
        querySnapshot.forEach( doc => {

            const fullDoc = {
                data: doc.data(),
                docId: doc.id
            }
            data.push( fullDoc )
        })
        const res = data[0]
        return res

    } catch ( error ) {
        if(error instanceof Error){
            console.error(`error: ${error.message}`)
        }
        throw error
    }
}

const deleteDocById = async ( collection, docId ) => {
    try {
        const docRef = db.collection( collection ).doc( docId )
        await docRef.delete()

    } catch (error) {
        if(error instanceof Error){
            console.error(`error: ${error.message}`)
        }
        throw error
    }
}

const getAllDocsFromCollection = async ( collection ) => {
    try {
        const data = []
        const collectionRef = db.collection( collection )
        const snapshot = await collectionRef.get()
        if (snapshot.empty ){
            return data
        } else {
            snapshot.forEach( doc => {
                data.push( doc.data() )
            })
            return data 
        }

    } catch ( error ) {
        if(error instanceof Error){
            console.error(`error: ${error.message}`)
        }
        throw error
    }
}

const updateDocArrayById = async ( collection, docId, updateProperty, updateValue ) => {

    try {
        const docRef = db.collection( collection ).doc( docId )
        await docRef.update({
            [updateProperty]: FieldValue.arrayUnion( updateValue )
        })

    } catch ( error ) {
        if(error instanceof Error){
            console.error(`error: ${error.message}`)
        }
        throw error
    }
}



//EXPORTS
module.exports = {
    createDocumentInCollection,
    updateDocumentProperties,
    getDocsWhereCondition,
    getDocByDocRef,
    deleteAuthUser,
    getDocIdWithCondition,
    deleteDocById,
    getAllDocsFromCollection,
    getDocAndIdWithCondition,
    updateDocArrayById
}