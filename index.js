require("dotenv").config();
const express = require("express");
const userRouter = require("./routes/user");
const doctorRouter = require("./routes/doctor");
const doctorAppointment = require("./routes/Appointment");
const data = require("./databases/mangodb"); // تأكد أن هذا الملف لا يحتوي على app.listen داخله
const app = express();
var cors = require('cors');
const path = require('path');

const PORT = process.env.PORT || 3000;

// إعدادات Middleware
app.use('/uploadsUser', express.static(path.join(__dirname, 'uploadsUser')));
app.use(cors({
    origin: '*'
}));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/user", userRouter);
app.use("/Appointment", doctorAppointment);
app.use("/doctor", doctorRouter);

module.exports = app;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}