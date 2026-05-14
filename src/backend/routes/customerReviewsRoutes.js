const express=require('express')
const control=require('./../controllers/customerReviewsController')

const router=express.Router()
router.get("/customer-reviews",control.getAllCustomerReviews)
router.post("/customer-reviews",control.createCustomerReviews)
router.put("/customer-reviews/:id",control.updateCustomerReviews)
router.delete("/customer-reviews/:id",control.deleteCustomerReviews)

module.exports=router