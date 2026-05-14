const express=require('express')
const control=require('./../controllers/recipesController')

const router=express.Router()
router.get("/recipes",control.getAllRecipes)
router.post("/recipes",control.createRecipes)
router.put("/recipes/:id",control.updateRecipes)
router.delete("/recipes/:id",control.deleteRecipes)

module.exports=router