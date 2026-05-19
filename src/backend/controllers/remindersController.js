const db = require("./../db/database")

const getAllReminders = (req, res) => {
    const reminders = db.prepare('SELECT * FROM REMINDERS').all()
    res.json(reminders)
}
const createReminder = (req, res) => {
    const { title, description, date, time, repeat, repeat_day, person_name, phone, is_completed } = req.body
    db.prepare('INSERT INTO REMINDERS (title,description,date,time,repeat,repeat_day,person_name,phone,is_completed) VALUES (?,?,?,?,?,?,?,?,?)').run(title, description, date, time, repeat, repeat_day, person_name, phone, is_completed)
    res.json({ message: "başarıyla eklendi" })
}
const updateReminder = (req, res) => {
    const id = req.params.id
    const { title, description, date, time, repeat, repeat_day, person_name, phone, is_completed } = req.body
    db.prepare('UPDATE REMINDERS SET title=?,description=?,date=?,time=?,repeat=?,repeat_day=?,person_name=?,phone=?,is_completed=? WHERE id=?').run(title, description, date, time, repeat, repeat_day, person_name, phone, is_completed, id)
    res.json({ message: "başarıyla güncellendi" })
}
const deleteReminder = (req, res) => {
    const id = req.params.id
    db.prepare('DELETE FROM REMINDERS WHERE id=?').run(id)
    res.json({ message: "Silindi" })
}
const snoozeReminder = (req, res) => {
    const id = req.params.id
    const { snoozed_until } = req.body
    db.prepare('UPDATE REMINDERS SET snoozed_until = ? WHERE id = ?').run(snoozed_until, id)
    res.json({ message: 'Ertelendi' })
  }
module.exports = { getAllReminders, createReminder, updateReminder, deleteReminder,snoozeReminder }