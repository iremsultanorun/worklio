const express=require('express')
const control=require('./../controllers/goalsController')

const router=express.Router()
router.get("/goals",control.getAllGoals)
router.post("/goals",control.createGoals)
router.put("/goals/:id",control.updateGoals)
router.delete("/goals/:id",control.deleteGoals)

module.exports=router