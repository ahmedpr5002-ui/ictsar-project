const mongoose=require("mongoose")
const data = mongoose.connect(process.env.DATA_URL).then(()=>{
    console.log("connect")
}).catch(()=>{
    console.log("connect")

})
module.exports = data