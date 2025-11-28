// server.js  (API ONLY)

const express = require('express');
const cors = require('cors');

const app = express();

// --- CORS ---
app.use(cors({
  origin: '*',                           // later you can change to your domain
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// handle all OPTIONS preflight requests
app.options('*', cors());

// ❌ IMPORTANT:
// NO express.static
// NO app.get('/')

// --- CONTACT API ---
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
