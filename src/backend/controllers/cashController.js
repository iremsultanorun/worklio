const db = require("./../db/database")

const getAllCash = (req, res) => {
    const cash = db.prepare('SELECT * FROM CASH').all()
    res.json(cash)
}
const createCash = (req, res) => {
    const {date,amount,density} = req.body
    db.prepare('INSERT INTO CASH (date,amount,density) VALUES (?,?,?)').run(date,amount,density)
    res.json({ message: "başarıyla eklendi" })
}
const updateCash = (req, res) => {
    const id = req.params.id
    const { date,amount,density} = req.body
    db.prepare('UPDATE CASH SET date=?, amount=? ,density=? WHERE id=?').run(date,amount,density, id)
    res.json({ message: "başarıyla güncellendi" })
}
const deleteCash = (req, res) => {
    const id = req.params.id
    db.prepare('DELETE FROM CASH WHERE id=?').run(id)
    res.json({ message: "Silindi" })
}
module.exports = { getAllCash,createCash,updateCash,deleteCash }