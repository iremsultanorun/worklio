const db = require("./../db/database")

const getAllGoals = (req, res) => {
    const goals = db.prepare('SELECT * FROM GOALS').all()
    res.json(goals)
}
const createGoals  = (req, res) => {
    const {goal_name,target_amount,current_amount,end_date,is_completed} = req.body
    db.prepare('INSERT INTO GOALS (goal_name,target_amount,current_amount,end_date,is_completed) VALUES (?,?,?,?,?)').run(goal_name,target_amount,current_amount,end_date,is_completed)
    res.json({ message: "başarıyla eklendi" })
}
const updateGoals  = (req, res) => {
    const id = req.params.id
    const {goal_name,target_amount,current_amount,end_date,is_completed} = req.body
    db.prepare('UPDATE GOALS SET goal_name=?,target_amount=?,current_amount=?,end_date=?,is_completed=? WHERE id=?').run(goal_name,target_amount,current_amount,end_date,is_completed,id)
    res.json({ message: "başarıyla güncellendi" })
}
const deleteGoals  = (req, res) => {
    const id = req.params.id
    db.prepare('DELETE FROM GOALS WHERE id=?').run(id)
    res.json({ message: "Silindi" })
}
module.exports = { getAllGoals ,createGoals ,updateGoals ,deleteGoals  }