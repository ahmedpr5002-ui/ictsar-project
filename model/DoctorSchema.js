const mongoose = require('mongoose');
const { Schema } = mongoose;

const doctorSchema = new Schema({
    name:String,
    specialty:String,
    image:String,
    des:String,
    expier:Number
  
}, { 
  timestamps: true 
});



const Doctor = mongoose.model('Doctor', doctorSchema);
module.exports = Doctor;