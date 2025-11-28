// server.js  (API ONLY with MongoDB + Email)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

// --- CORS ---
app.use(cors({
    origin: '*', // later you can restrict to your domain
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.options('*', cors());

// --- MONGODB CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

// --- SCHEMA & MODEL ---
const contactSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    services: String,
    message: String,
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// --- NODEMAILER TRANSPORT ---
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,         // e.g. "smtp.gmail.com"
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,                       // true for 465, false for 587/others
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// (optional) verify transporter
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Mail transporter error:', error.message);
    } else {
        console.log('✅ Mail transporter ready');
    }
});

// --- CONTACT API ---
app.post('/api/contact', async (req, res) => {
    const { firstName, lastName, phone, email, services, message } = req.body;

    if (!firstName || !lastName || !phone || !email || !services || !message) {
        return res.status(400).json({
            success: false,
            message: 'Please fill in all required fields.'
        });
    }

    try {
        // 1) Save to MongoDB
        const contactDoc = await Contact.create({
            firstName,
            lastName,
            phone,
            email,
            services,
            message
        });

        console.log('✅ Saved contact:', contactDoc._id);

        // 2) Send email to the user
        await transporter.sendMail({
            from: process.env.FROM_EMAIL,  // e.g. "Enecovery <no-reply@yourdomain.com>"
            to: email,
            subject: 'Thank you for contacting Enecovery',
            html: `
        <p>Hi ${firstName},</p>
        <p>Thank you for reaching out to Enecovery.</p>
        <p>We have received your request regarding <strong>${services}</strong> and our team will get back to you soon.</p>
        <p><strong>Your message:</strong></p>
        <p>${message}</p>
        <p>Best regards,<br/>Enecovery Team</p>
      `
        });

        // 3) (Optional) Email to admin / you
        if (process.env.ADMIN_EMAIL) {
            await transporter.sendMail({
                from: process.env.FROM_EMAIL,
                to: process.env.ADMIN_EMAIL,
                subject: 'New contact form submission',
                html: `
          <h3>New Contact Submission</h3>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Service:</strong> ${services}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        `
            });
        }

        return res.json({
            success: true,
            message: `Thank you, ${firstName}! We've received your request for "${services}". Our team will contact you soon at ${email}.`
        });

    } catch (err) {
        console.error('❌ Error in /api/contact:', err);
        return res.status(500).json({
            success: false,
            message: 'Something went wrong. Please try again later.'
        });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`API running on port ${PORT}`);
});
