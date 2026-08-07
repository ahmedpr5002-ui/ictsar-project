require("dotenv").config();
const express = require("express");
const serverless = require('serverless-http');
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const path = require('path');



const userRouter = require("./routes/user");
const medicalRouter = require("./routes/medicalEntity");
const doctorRouter = require("./routes/doctor");
const doctorAppointment = require("./routes/Appointment");
const state = require("./routes/status");
const connectDB = require("./databases/mangodb"); 


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();



app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use("/user", userRouter);
app.use("/Appointment", doctorAppointment);
app.use("/doctor", doctorRouter);
app.use("/statues", state);
app.use("/medical", medicalRouter);


if (process.env.NODE_ENV !== 'production') {
    
    connectDB().then(() => {
        const PORT = 4000;
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    });
}

module.exports = app;

module.exports.handler = serverless(async (req, res) => {
    await connectDB();
    return app(req, res);
});
