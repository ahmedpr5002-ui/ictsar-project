const express = require("express")
const auth = require("../auth/jwt")
const router = express.Router()
const Doctor = require("../model/DoctorSchema")
const multer = require('multer')
const fs = require('fs') 

const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// إعدادات التخزين
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir) 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: storage })

router.post("/Doctor",auth, upload.single('image'), async (req, res) => {
    if(req.user.role!=="admin"){
        console.log(req.user.role)
         return res.status(403).send({ message: "auth error" ,admin:req.user.role});


    }
    const { name, specialty, expier, des } = req.body
    try {
        console.log(auth.user)
        if (!name || !specialty || !expier || !des || !req.file) {
            return res.status(400).send({ message: "all info and image are required" });
        }

        const newDoc = new Doctor({
            name,
            specialty,
            des,
            expier,
            image: req.file.path // سيخزن المسار مثل: uploads/171541...jpg
        })

        await newDoc.save()
        return res.status(201).send({ message: "created the doc :)", data: newDoc });

    } catch (error) {
        return res.status(500).send({ message: "error in server", error: error.message });
    }
})

router.get("/Doctors", async (req, res) => {
   
   
    try {
        const doctors=await Doctor.find();
        return res.status(200).send({ message: "True", doctors: doctors});

      
        }

     catch (error) {
        return res.status(500).send({ message: "error in server", error: error.message });
    }
})

module.exports = router