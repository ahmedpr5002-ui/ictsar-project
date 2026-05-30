const jwt = require("jsonwebtoken")
const { model } = require("mongoose")
const auth = async(req,res,next)=>{
    let token = req.headers['authorization']
    if(!token){
        return res.status(400).send("login first")
    }
    token = token.split(" ")[1]
    jwt.verify(token,process.env.TOKEN_VAL,(err,decoded)=>{
        if(err){
            return res.status(400).send("invalid token")

        }else{
            console.log(decoded)
            req.user=decoded
            next()
        }
    })

}
module.exports = auth