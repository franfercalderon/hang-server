const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config()

//ROUTES
const userRoutes = require('./routes/userRoutes')
const slotRoutes = require('./routes/slotRoutes')
const friendRoutes = require('./routes/friendRoutes')
const adminRoutes = require('./routes/adminRoutes')
const notificationRoutes = require('./routes/notificationsRoutes')
const mapsRoutes = require('./routes/mapsRoutes')
const devRoutes = require('./routes/devRoutes' )

//APP
const app = express();
app.use(cors());
// app.use('/api/accounts/stripe_webhook', express.raw({ type: '*/*' }))

app.use(express.json());

app.use('/admin', adminRoutes )
app.use('/users', userRoutes )
app.use('/slots', slotRoutes )
app.use('/friends', friendRoutes )
app.use('/notifications', notificationRoutes )
app.use('/maps', mapsRoutes )
app.use('/dev', devRoutes )


app.get('/', ( req, res ) => {
    res.status(200).json({ message: 'Testo Bueno' })
})

const PORT = process.env.PORT || 5000;
app.listen( PORT, () => console.log(`Server running on port ${ PORT }`));