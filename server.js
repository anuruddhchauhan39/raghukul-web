const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();

// --- 1. Folders Setup (Zaroori hai file upload ke liye) ---
const uploadDir = path.join(__dirname, 'uploads/donations/');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// --- 2. Middlewares ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, '/')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 3. Database Connection ---
mongoose.connect("mongodb+srv://anuruddhchauhan21:anuruddh%409027@cluster0.bsu0qme.mongodb.net/raghukulDB?retryWrites=true&w=majority")
  .then(() => console.log("Database Connected Successfully! 🚀"))
  .catch((err) => console.log("DB Connection Error: ", err));

// --- 4. Multer Setup (Screenshot Upload) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, 'Donation-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- 5. Models (Schema) ---
const Help = mongoose.model('Help', { 
    name: String, phone: String, reason: String, date: { type: Date, default: Date.now }
});

const Member = mongoose.model('Member', {
    fullName: String,
    mobile: String,
    address: String,
    samitiId: String,
    date: { type: Date, default: Date.now }
});

const Donation = mongoose.model('Donation', { 
    name: String, 
    phone: String, 
    screenshot: String,
    date: { type: Date, default: Date.now }
});

// --- 6. Routes ---

// Madad Form Submission
app.post('/apply-help', async (req, res) => {
    try {
        const newHelp = new Help(req.body);
        await newHelp.save();
        res.send("<script>alert('Aapka aavedan samiti ko mil gaya hai!'); window.location.href='/index.html';</script>");
    } catch (err) { res.status(500).send("Server Error"); }
});

// Registration with Unique ID (RS-101...)
app.post('/register-member', async (req, res) => {
    try {
        const count = await Member.countDocuments();
        const uniqueId = `RS-${100 + count + 1}`; 

        const newMember = new Member({
            fullName: req.body.fullName,
            mobile: req.body.mobile,
            address: req.body.address,
            samitiId: uniqueId
        });

        await newMember.save();
        res.send(`<script>alert('Registration Safal! Aapki Sadasya ID hai: ${uniqueId}'); window.location.href='/index.html';</script>`);
    } catch (err) { res.status(500).send("Registration Error"); }
});

// Donation with Screenshot
app.post('/record-donation', upload.single('screenshot'), async (req, res) => {
    try {
        const newDonation = new Donation({
            name: req.body.name,
            phone: req.body.phone,
            screenshot: req.file ? req.file.filename : ''
        });
        await newDonation.save();
        res.send("<script>alert('Sahyog ke liye dhanyawad! Details save ho gayi hain.'); window.location.href='/index.html';</script>");
    } catch (err) { res.status(500).send("Upload Error"); }
});

// Public Member List (Sirf Naam aur ID dikhegi)
app.get('/get-public-members', async (req, res) => {
    try {
        const data = await Member.find().select('fullName samitiId -_id');
        res.json(data);
    } catch (err) { res.status(500).json([]); }
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

// Admin Dashboard Data Routes
app.get('/get-help-requests', async (req, res) => { res.json(await Help.find()); });
app.get('/get-members', async (req, res) => { res.json(await Member.find()); });
app.get('/get-donations', async (req, res) => { res.json(await Donation.find()); });

// --- 7. Start Server (Render Compatible) ---
const PORT = process.env.PORT || 3000;

// --- 7. Delete Entries (Admin Special) ---
app.delete('/delete-entry/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        let model;

        // Type ke hisaab se sahi table (model) chunna
        if (type === 'help') model = Help;
        else if (type === 'member') model = Member;
        else if (type === 'donation') model = Donation;

        if (model) {
            await model.findByIdAndDelete(id);
            res.json({ success: true, message: "Entry Deleted!" });
        } else {
            res.status(400).json({ success: false, message: "Invalid Type" });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
app.listen(PORT, () => console.log(`Raghukul Server Live on Port ${PORT} 🚀`));