 const mongoose = require('mongoose');
 const { Schema } = mongoose;


const AppointmentSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Doctor",
        required: true
    },
   
    slot: {
        type: String,
        required: [true, "يجب تحديد وقت الموعد"],
    },
    date:{
        type: String,
        required: [true, "يجب تحديد تاريخ الموعد "],
    },
    stat:{
        type: String,
        enum: ['copcomplete', 'incomplete'],
        default: 'incomplete'
    },
    
}, { 
    timestamps: true 
});
const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment;