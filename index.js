require("dotenv").config();
const express = require("express");
const serverless = require('serverless-http'); // إضافة هذه المكتبة
const userRouter = require("./routes/user");
const doctorRouter = require("./routes/doctor");
const doctorAppointment = require("./routes/Appointment");
const connectDB = require("./databases/mangodb");
const app = express();
var cors = require('cors');
const path = require('path');

connectDB();

app.use('/uploadsUser', express.static(path.join(__dirname, 'uploadsUser')));
app.use(cors({ origin: '*' }));
app.use('/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/user", userRouter);
app.use("/Appointment", doctorAppointment);
app.use("/doctor", doctorRouter);


module.exports = app;
module.exports.handler = serverless(app);