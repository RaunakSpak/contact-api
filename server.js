const express = require('express');
const cors = require('cors');

const app = express();

// CORS setup – for now allow all origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Handle all OPTIONS preflight requests
app.options('*', cors());

// 🚫 IMPORTANT: We do NOT serve any HTML files here.
// So we REMOVE:
//   app.use(express.static(...))
//   app.get('/', ...)

app.post('/api/contact', (req, res) => {
    const { firstName, lastName, phone, email, services, message } = req.body;

    if (!firstName || !lastName || !phone || !email || !services || !message) {
        return res.status(400).json({
            success: false,
            message: 'Please fill in all required fields.'
        });
    }

    console.log('New contact form submission:', {
        firstName,
        lastName,
        phone,
        email,
        services,
        message
    });

    return res.json({
        success: true,
        message: `Thank you, ${firstName}! We've received your request for "${services}". Our team will contact you soon at ${email}.`
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
