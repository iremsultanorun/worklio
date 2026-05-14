const express=require("express")
const cors=require("cors")
const app=express()
const PORT=3000
app.use(express.json())
app.use(cors())
const schema = require('./db/schema')
const remindersRouter=require('./routes/remindersRoutes')
const recipesRouter=require('./routes/recipesRoutes')
const paymentsRouter=require('./routes/paymentsRoutes')
const notesRouter=require('./routes/notesRoutes')
const goalsRouter=require('./routes/goalsRoutes')
const customerReviewsRouter=require('./routes/customerReviewsRoutes')
const cashRouter=require('./routes/cashRoutes')
app.use(remindersRouter)
app.use(recipesRouter)
app.use(paymentsRouter)
app.use(notesRouter)
app.use(goalsRouter)
app.use(customerReviewsRouter)
app.use(cashRouter)
app.get("/",(req,res)=>{
    res.json({ mesaj: "Worklio API çalışıyor" })
})

app.listen(PORT,()=>{
    console.log("çalışıyor mu?");
})