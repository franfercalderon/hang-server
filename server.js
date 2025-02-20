const express = require('express');
const cors = require('cors');
const path = require('path');

require('dotenv').config();

//CORS CONFIGURATION
const allowedOrigins = ['https://gethangapp.com', 'https://api.gethangapp.com', 'https://www.gethangapp.com', 'https://www.api.gethangapp.com'];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn('Here the error', origin )
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'MasterToken', 'inviteid'], 
    credentials: true
};

//APP INSTANCE
const app = express();

app.use(cors(corsOptions));

app.options('*', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MasterToken, inviteid'); 
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
});

app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
});

//JSON
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
    res.status(200).json({ message: 'Hang Server Running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

