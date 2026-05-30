const express=require("express")
const router=express.Router()
const jwt = require("jsonwebtoken")
const fs = require('fs') 
const multer = require('multer')
const bcrypt = require("bcryptjs")
const user = require("../model/UserSchema")
const mongoose =require("mongoose")

const uploadDir = 'uploadsUser/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + file.originalname)
  }
})

const upload = multer({ storage: storage })



router.post("/register",upload.single('image'), async(req,res)=>{
    try{
         const {username,email,password,image}= req.body
    if(!username || !email || !password || !req.file){
        return res.status(400).send({message:"all info is required"})
    }
    let newUser = await user.findOne({$or: [{ email }, { username }]})
    if(newUser){
       return res.status(400).send({message:"the email is or username is used"})
    }

    
    newUser= new user({
        username,
        email,
        password:await bcrypt.hash(password,10),
        image:req.file.path
    })
    await newUser.save()
    const token = jwt.sign({id:newUser._id,email,username},process.env.TOKEN_VAL,{expiresIn:"1w"})
    return res.status(201).send({masege:"the user is created",
        token:token
    })
    

   


} catch (error) {
    console.error("خطأ السيرفر الفعلي:", error); 
    
    // التعديل: إرسال نص الخطأ الحقيقي لكي تراه في الـ React فوراً بدل الانهيار المبهم
    return res.status(500).send({ 
        message: "حدث خطأ في الخادم أثناء الحفظ", 
        error: error.message 
    });
}
   


})
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).send({ message: "all info is required" })
        }
        
        // جلب المستخدم مع كلمة المرور والاسم والصورة
        let newUser = await user.findOne({ email }).select("+password");
        if (!newUser) {
            return res.status(400).send({ message: "the user is not found" })
        }
        
        const pass = await bcrypt.compare(password, newUser.password)
        
        if (pass) {
            // التعديل هنا: قمنا بإضافة username: newUser.username داخل الـ Token
            const token = jwt.sign(
                {
                    id: newUser._id,
                    email,
                    username: newUser.username, // <-- هذا السطر الناقص
                    role: newUser.role,
                    image: newUser.image
                },
                process.env.TOKEN_VAL,
                { expiresIn: "1w" }
            )

            return res.status(200).send({
                masege: "login",
                token: token
            })
        } else {
            return res.status(400).send({ masege: "password is false" })
        }
    } catch (error) {
        console.log("DETAILED ERROR:", error);
        return res.status(500).send({ message: "error in server", error: error.message });
    }
})
module.exports=router