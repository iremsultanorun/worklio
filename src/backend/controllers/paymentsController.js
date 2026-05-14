const db = require("./../db/database")

const getAllPayments = (req, res) => {
    const payments = db.prepare('SELECT * FROM PAYMENTS').all()
    res.json(payments)
}
const createPayments = (req, res) => {
    const {payment_name,amount,due_date,category,is_paid} = req.body
    db.prepare('INSERT INTO PAYMENTS (payment_name,amount,due_date,category,is_paid) VALUES (?,?,?,?,?)').run(payment_name,amount,due_date,category,is_paid)
    res.json({ message: "başarıyla eklendi" })
}
const updatePayments = (req, res) => {
    const id = req.params.id
    const {payment_name,amount,due_date,category,is_paid} = req.body
    db.prepare('UPDATE PAYMENTS SET payment_name=?,amount=?,due_date=?,category=?,is_paid=? WHERE id=?').run(payment_name,amount,due_date,category,is_paid,id)
    res.json({ message: "başarıyla güncellendi" })
}
const deletePayments = (req, res) => {
    const id = req.params.id
    db.prepare('DELETE FROM PAYMENTS WHERE id=?').run(id)
    res.json({ message: "Silindi" })
}
module.exports = { getAllPayments,createPayments,updatePayments,deletePayments }