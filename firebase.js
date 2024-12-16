const admin = require( 'firebase-admin' )
const { getFirestore } = require( 'firebase-admin/firestore' )
const serviceAccount = require('./config/serviceAccount.json')

//FIREBASE CONFIG
const initializationCount = admin.apps.length;

if (initializationCount === 0) {
    admin.initializeApp({
        credential: admin.credential.cert( serviceAccount )
    });
}


const db = getFirestore()

module.exports = {
    db,
    admin
} 