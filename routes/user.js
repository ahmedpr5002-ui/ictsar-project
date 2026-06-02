const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const user = require("../model/UserSchema");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'users_profiles',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp', 'gif'],
    public_id: (req, file) => `user-${Date.now()}`
  },
});

const upload = multer({ storage: storage });

router.post("/register", (req, res) => {
  upload.single('image')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: "خطأ في رفع الصورة", error: err.message });
    try {
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new user({ username, email, password: hashedPassword, image: req.file.path, role: "user" });
      await newUser.save();
      const token = jwt.sign({ id: newUser._id, email, username, role: "user" }, process.env.TOKEN_VAL, { expiresIn: "1w" });
      return res.status(201).json({ message: "User created", token });
    } catch (error) { return res.status(500).json({ error: error.message }); }
  });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await user.findOne({ email }).select("+password");
    if (!existingUser) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, existingUser.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });
    
    // تأكد من إضافة الـ role هنا
    const token = jwt.sign(
      { id: existingUser._id, email: existingUser.email, username: existingUser.username, role: existingUser.role },
      process.env.TOKEN_VAL,
      { expiresIn: "1w" }
    );
    return res.status(200).json({ message: "Login successful", token });
  } catch (error) { return res.status(500).json({ error: error.message }); }
});

module.exports = router;