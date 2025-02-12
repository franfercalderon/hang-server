// const express = require('express');
// const cors = require('cors');
// const path = require('path');

// require('dotenv').config()

// //APP
// const app = express();

//ORIGINAL
// app.use(cors());

//UPDATE2
// app.use(cors({
//     origin: 'https://gethangapp.com', 
//     methods: 'GET,POST,PUT,DELETE,OPTIONS',
//     allowedHeaders: 'Content-Type,Authorization',
//     credentials: true 
// }));
// app.options('*', cors());

//UPDATE3
// const allowedOrigins = ['https://gethangapp.com']; // Change this if you need multiple origins

// // ✅ Apply CORS middleware
// const corsOptions = {
//     origin: function (origin, callback) {
//         if (!origin || allowedOrigins.includes(origin)) {
//             callback(null, true);
//         } else {
//             callback(new Error('Not allowed by CORS'));
//         }
//     },
//     methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
//     allowedHeaders: 'Content-Type,Authorization',
//     credentials: true // Allow cookies if needed
// };

// // const app = express();
// app.use(cors(corsOptions));  // ✅ Apply CORS globally

// // ✅ Handle Preflight (OPTIONS) Requests
// app.options('*', cors(corsOptions));


// app.use(express.json());

// //ROUTES
// const userRoutes = require('./routes/userRoutes')
// const slotRoutes = require('./routes/slotRoutes')
// const friendRoutes = require('./routes/friendRoutes')
// const adminRoutes = require('./routes/adminRoutes')
// const notificationRoutes = require('./routes/notificationsRoutes')
// const mapsRoutes = require('./routes/mapsRoutes')
// const devRoutes = require('./routes/devRoutes' )
// const calendarAPIRoutes = require('./routes/googleOAuthRoutes')


// app.use('/admin', adminRoutes )
// app.use('/users', userRoutes )
// app.use('/slots', slotRoutes )
// app.use('/friends', friendRoutes )
// app.use('/notifications', notificationRoutes )
// app.use('/maps', mapsRoutes )
// app.use('/dev', devRoutes )
// app.use('/calendarAPI', calendarAPIRoutes )


// app.get('/', ( req, res ) => {
//     res.status(200).json({ message: 'Testo Bueno' })
// })

// const PORT = process.env.PORT || 5000;
// app.listen( PORT, () => console.log(`Server running on port ${ PORT }`));

//UPDATE4
const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

// ✅ Define allowed origins
const allowedOrigins = ['https://gethangapp.com']; // Add other allowed origins if needed

// ✅ CORS Configuration
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true // ✅ Allow cookies & authentication headers
};

// ✅ Create Express App
const app = express();
app.use(cors(corsOptions)); // ✅ Apply CORS globally

// ✅ Handle Preflight (OPTIONS) Requests Properly
app.options('*', (req, res) => {
    res.set('Access-Control-Allow-Origin', 'https://gethangapp.com');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.set('Access-Control-Allow-Credentials', 'true');
    res.sendStatus(204); // ✅ Send success response
});

app.use(express.json());

// ROUTES
const userRoutes = require('./routes/userRoutes');
const slotRoutes = require('./routes/slotRoutes');
const friendRoutes = require('./routes/friendRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationsRoutes');
const mapsRoutes = require('./routes/mapsRoutes');
const devRoutes = require('./routes/devRoutes');
const calendarAPIRoutes = require('./routes/googleOAuthRoutes');

app.use('/admin', adminRoutes);
app.use('/users', userRoutes);
app.use('/slots', slotRoutes);
app.use('/friends', friendRoutes);
app.use('/notifications', notificationRoutes);
app.use('/maps', mapsRoutes);
app.use('/dev', devRoutes);
app.use('/calendarAPI', calendarAPIRoutes);

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Testo Bueno' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
