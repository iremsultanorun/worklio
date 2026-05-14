const db = require("./../db/database")

const getAllNotes = (req, res) => {
    const notes = db.prepare('SELECT * FROM NOTES').all()
    res.json(notes)
}
const createNotes = (req, res) => {
    const {title,content,importance,reminder_date} = req.body
    db.prepare('INSERT INTO NOTES (title,content,importance,reminder_date) VALUES (?,?,?,?)').run(title,content,importance,reminder_date)
    res.json({ message: "başarıyla eklendi" })
}
const updateNotes = (req, res) => {
    const id = req.params.id
    const {title,content,importance,reminder_date} = req.body
    db.prepare('UPDATE NOTES SET title=?,content=?,importance=?,reminder_date=? WHERE id=?').run(title,content,importance,reminder_date,id)
    res.json({ message: "başarıyla güncellendi" })
}
const deleteNotes = (req, res) => {
    const id = req.params.id
    db.prepare('DELETE FROM NOTES WHERE id=?').run(id)
    res.json({ message: "Silindi" })
}
module.exports = { getAllNotes,createNotes,updateNotes,deleteNotes }