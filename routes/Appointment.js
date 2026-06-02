const express = require('express');

const router = express.Router();
const Appointment = require('../model/AppointmentSchema'); 
const authMiddleware = require('../auth/jwt'); 

router.post("/slot", authMiddleware, async (req, res) => {
    try {
        const user = req.user.id;
        const { doctor, slot, date } = req.body;
        
        let newSlot = new Appointment({
            user,
            doctor,
            slot,
            date
        });
        
        await newSlot.save();
        return res.status(201).send({ message: 'created slot', data: newSlot });
    } catch (error) {
        console.error("Error creating slot:", error);
        return res.status(500).send({ message: "حدث خطأ في الخادم", error: error.message });
    }
});
router.get("/slot",authMiddleware,async(req,res)=>{
    const slots = await Appointment.find().populate("user").populate("doctor")
    return res.status(200).send(slots)

})
router.get("/todayslots", authMiddleware, async (req, res) => {
    try {
   
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0); 

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todaySlots = await Appointment.find({
            createdAt: {
                $gte: startOfToday,
                $lte: endOfToday
            }
        })
        .populate("user")
        .populate("doctor");

        return res.status(200).send(todaySlots);

    } catch (error) {
        return res.status(500).send({ 
            message: "حدث خطأ أثناء جلب حجوزات اليوم", 
            error: error.message 
        });
    }
});
router.get("/slot/:id", authMiddleware, async (req, res) => {
    try {
        // البحث عن جميع الحجوزات التابعة لهذا الشخص بالتحديد
        const slots = await Appointment.find({ user: req.params.id })
            .populate("user")
            .populate("doctor");

        // إذا لم يتم العثور على أي حجوزات لهذا الشخص
        if (slots.length === 0) {
            return res.status(404).send({ message: "لا توجد حجوزات مسجلة لهذا المستخدم" });
        }

        return res.status(200).send(slots);
    } catch (error) {
      
        return res.status(500).send({ message: "حدث خطأ أثناء جلب الحجوزات", error: error.message });
    }
});
router.delete("/slot/:id", authMiddleware, async (req, res) => {
    try {
       
        const slots = await Appointment.findByIdAndDelete(req.params.id)
        if(!slots){

            return res.status(400).send('not faond slot');
        }
          

      
      

        return res.status(200).send({status:"deleted",slot:slots});
    } catch (error) {
      
        return res.status(500).send({ message: "حدث خطأ أثناء حذف الحجوزات", error: error.message });
    }
});

router.put("/slot/:id", authMiddleware, async (req, res) => {
    try {
        const { stat } = req.body;

        if (!stat) {
            return res.status(400).send({ message: "الحالة (stat) مطلوبة" });
        }

      
        const updatedAppointment = await Appointment.findByIdAndUpdate(
            req.params.id,
            { stat: stat },
            { new: true } 
        );

        
        if (!updatedAppointment) {
            return res.status(404).send({ message: "لم يتم العثور على هذا الحجز" });
        }

        return res.status(200).send({ 
            message: "تم تحديث حالة الحجز بنجاح", 
            appointment: updatedAppointment 
        });

    } catch (error) {
        return res.status(500).send({ 
            message: "حدث خطأ أثناء تحديث حالة الحجز", 
            error: error.message 
        });
    }
});
module.exports = router;
