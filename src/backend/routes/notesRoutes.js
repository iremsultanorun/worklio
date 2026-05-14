const express=require('express')
const control=require('./../controllers/notesController')

const router=express.Router()
router.get("/notes",control.getAllNotes)
router.post("/notes",control.createNotes)
router.put("/notes/:id",control.updateNotes)
router.delete("/notes/:id",control.deleteNotes)

module.exports=router