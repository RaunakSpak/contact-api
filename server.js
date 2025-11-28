// server.js  (API ONLY with MongoDB + Email + Debug)

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();

/* ------------------------  BASIC MIDDLEWARE  ------------------------ */

app.use(cors({
    origin: '*',                      // later you can restrict to your domain
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.options('*', cors());           // handle preflight

/* ------------------------  DEBUG ENV CHECKS  ------------------------ */

console.log('MONGO_URI defined:', !!process.env.MONGO_URI);
console.log('SMTP_HOST defined:', !!process.env.SMTP_HOST);
console.log('SMTP_USER defined:', !!process.env.SMTP_USER);

/* ------------------------  MONGODB CONNECTION  ------------------------ */

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));

/* ------------------------  SCHEMA & MODEL  ------------------------ */

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

/* ------------------------  NODEMAILER TRANSPORT  ------------------------ */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,                 // e.g. smtp-relay.brevo.com
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,                               // true for 465, false for 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// verify mail transporter (will log error but not crash app)
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Mail transporter error:', error.message);
    } else {
        console.log('✅ Mail transporter ready');
    }
});

/* ------------------------  ROUTES  ------------------------ */

// Health route – quick check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

// Main contact form route
app.post('/api/contact', async (req, res) => {
    console.log('🔹 /api/contact called with body:', req.body);

    const { firstName, lastName, phone, email, services, message } = req.body;

    // Basic validation
    if (!firstName || !lastName || !phone || !email || !services || !message) {
        console.log('❌ Validation failed: missing fields');
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

        console.log('✅ Saved contact with _id:', contactDoc._id);

        // 2) Send email to the user (wrapped in its own try/catch so DB save still counts)
        try {
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
            console.log('📧 User email sent to:', email);
        } catch (mailErr) {
            console.error('❌ Error sending user email:', mailErr.message);
            // do NOT return error – we already saved the contact
        }

        // 3) Optional: Email to admin/you
        if (process.env.ADMIN_EMAIL) {
            try {
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
                console.log('📧 Admin email sent to:', process.env.ADMIN_EMAIL);
            } catch (adminErr) {
                console.error('❌ Error sending admin email:', adminErr.message);
            }
        }

        // 4) Respond to frontend
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

// Debug route: see last 5 contacts stored in DB
app.get('/api/debug-contacts', async (req, res) => {
    try {
        const docs = await Contact.find().sort({ createdAt: -1 }).limit(5);
        console.log('🔍 Last 5 contacts:', docs);
        res.json(docs);
    } catch (err) {
        console.error('❌ Error in /api/debug-contacts:', err);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

/* ------------------------  START SERVER  ------------------------ */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 API running on port ${PORT}`);
});
