const db = require("./../db/database")

const getAllCustomerReviews = (req, res) => {
    const customerReviews = db.prepare('SELECT * FROM CUSTOMER_REVIEWS').all()
    res.json(customerReviews)
}
const createCustomerReviews  = (req, res) => {
    const {note,tag,date} = req.body
    db.prepare('INSERT INTO CUSTOMER_REVIEWS (note,tag,date) VALUES (?,?,?)').run(note,tag,date)
    res.json({ message: "başarıyla eklendi" })
}
const updateCustomerReviews  = (req, res) => {
    const id = req.params.id
    const {note,tag,date} = req.body
    db.prepare('UPDATE CUSTOMER_REVIEWS SET note=?,tag=?,date=? WHERE id=?').run(note,tag,date,id)
    res.json({ message: "başarıyla güncellendi" })
}
const deleteCustomerReviews  = (req, res) => {
    const id = req.params.id
    db.prepare('DELETE FROM CUSTOMER_REVIEWS WHERE id=?').run(id)
    res.json({ message: "Silindi" })
}
module.exports = { getAllCustomerReviews ,createCustomerReviews ,updateCustomerReviews ,deleteCustomerReviews  }