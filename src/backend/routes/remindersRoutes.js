const express=require('express')
const control=require('./../controllers/remindersController')

const router=express.Router()
router.get("/reminders",control.getAllReminders)
router.post("/reminders",control.createReminder)
router.put("/reminders/:id",control.updateReminder)
router.delete("/reminders/:id",control.deleteReminder)

module.exports=router