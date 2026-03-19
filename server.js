const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();

// --- 1. Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, '/')));
app.use('/uploads', express.static('uploads')); // Screenshots dikhane ke liye

// --- 2. Database Connection ---
mongoose.connect("mongodb+srv://anuruddhchauhan21:anuruddh%409027@cluster0.bsu0qme.mongodb.net/raghukulDB?retryWrites=true&w=majority")
  .then(() => console.log("Database Live! 🚀"))
  .catch((err) => console.log("DB Error: ", err));
// --- 3. Multer Setup (File Upload) ---
const storage = multer.diskStorage({
    destination: './uploads/donations/',
    filename: (req, file, cb) => {
        cb(null, 'Donation-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 4. Models ---
const Help = mongoose.model('Help', { 
    name: String, phone: String, reason: String 
});

const Member = mongoose.model('Member', {
    fullName: String,
    mobile: String,
    address: String,
    samitiId: String // <-- Ye nayi line zaroori hai ID save karne ke liye
});
const Donation = mongoose.model('Donation', { 
    name: String, 
    phone: String, 
    address: String, 
    screenshot: String,
    date: { type: Date, default: Date.now }
});

// --- 5. Routes ---

// Madad Form Submission
app.post('/apply-help', async (req, res) => {
    try {
        const newHelp = new Help(req.body);
        await newHelp.save();
        res.send("<script>alert('Aavedan Safal!'); window.location.href='/index.html';</script>");
    } catch (err) { res.status(500).send("Error"); }
});

// Registration Form Submission
app.post('/register-member', async (req, res) => {
    try {
        // Database mein kitne members hain ginein
        const count = await Member.countDocuments();
        const uniqueId = `RS-${100 + count + 1}`; // Ye RS-101 se shuru karega

        const newMember = new Member({
            fullName: req.body.fullName,
            mobile: req.body.mobile,
            address: req.body.address,
            samitiId: uniqueId
        });

        await newMember.save();
        
        // Response mein ID bhej rahe hain
        res.send(`<script>alert('Registration Safal! Aapki ID hai: ${uniqueId}'); window.location.href='/index.html';</script>`);
    } catch (err) {
        res.status(500).send("Error");
    }
});

// Donation with Screenshot Submission
app.post('/record-donation', upload.single('screenshot'), async (req, res) => {
    try {
        const newDonation = new Donation({
            name: req.body.name,
            phone: req.body.phone,
            address: req.body.address,
            screenshot: req.file ? req.file.filename : ''
        });
        await newDonation.save();
        res.status(200).send("Success");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving donation");
    }
});

// Sirf Naam aur ID dikhane ke liye route
app.get('/get-public-members', async (req, res) => {
    try {
        // .select() se mobile aur address chupa rahe hain
        const data = await Member.find().select('fullName samitiId -_id');
        res.json(data);
    } catch (err) {
        res.status(500).json([]);
    }
});

// Admin Login
app.post('/admin-login', (req, res) => {
    const { username, password } = req.body;
    if (username === "admin" && password === "raghukul@123") {
        res.json({ success: true });
    } else {
        res.json({ success: false, message: "Galat ID ya Password!" });
    }
});

// Admin Data Fetching Routes
app.get('/get-help-requests', async (req, res) => {
    const data = await Help.find();
    res.json(data);
});

app.get('/get-members', async (req, res) => {
    const data = await Member.find();
    res.json(data);
});

app.get('/get-donations', async (req, res) => {
    const data = await Donation.find();
    res.json(data);
});

// --- 6. Start Server ---
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT} 🚀`));