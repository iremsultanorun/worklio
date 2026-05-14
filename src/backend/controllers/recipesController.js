const db = require("./../db/database")

const getAllRecipes = (req, res) => {
    const recipes = db.prepare('SELECT * FROM RECIPES').all()
    res.json(recipes)
}
const createRecipes = (req, res) => {
    const { product_name,ingredients,preparation_note } = req.body
    db.prepare('INSERT INTO RECIPES (product_name,ingredients,preparation_note) VALUES (?,?,?)').run(product_name,ingredients,preparation_note)
    res.json({ message: "başarıyla eklendi" })
}
const updateRecipes = (req, res) => {
    const id = req.params.id
    const { product_name,ingredients,preparation_note } = req.body
    db.prepare('UPDATE RECIPES SET product_name=?,ingredients=?,preparation_note=? WHERE id=?').run(product_name,ingredients,preparation_note,id)
    res.json({ message: "başarıyla güncellendi" })
}
const deleteRecipes = (req, res) => {
    const id = req.params.id
    db.prepare('DELETE FROM RECIPES WHERE id=?').run(id)
    res.json({ message: "Silindi" })
}
module.exports = { getAllRecipes, createRecipes, updateRecipes, deleteRecipes }