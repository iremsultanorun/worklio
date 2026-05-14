const express = require("express")
const control=require("./../controllers/cashController")

const router=express.Router()
router.get("/cash",control.getAllCash)
router.post("/cash",control.createCash)
router.put("/cash/:id",control.updateCash)
router.delete("/cash/:id",control.deleteCash)

module.exports=router