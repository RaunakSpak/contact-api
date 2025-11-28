
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();


app.use(cors());
app.use(express.json());


app.use(express.static(path.join(__dirname)));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


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
    console.log(`Server running at http://localhost:${PORT}`);
});
