const express=require('express')
const control=require('./../controllers/paymentsController')

const router=express.Router()
router.get("/payments",control.getAllPayments)
router.post("/payments",control.createPayments)
router.put("/payments/:id",control.updatePayments)
router.delete("/payments/:id",control.deletePayments)

module.exports=router