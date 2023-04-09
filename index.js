const express = require('express')

const app = express()
const PORT = 4000

app.listen(PORT, () => {
  console.log(`API listening on PORT ${PORT} `)
})

app.get('/', (req, res) => {
  res.send('Hey this is my API running 🥳')
})

app.get('/about', (req, res) => {
  res.send('This is my about route..... ')
})

// Export the Express API
module.exports = app











// import cors from 'cors'
// import express from 'express'

// const app = express()

// app.use(express.json())

// //so frontend can connect to backend in peace lol
// app.use(cors())

// //connecting to mysql

// // const db = mysql.createConnection({
// //     host:"localhost",
// //     user:"root",
// //     password:"Diversity",
// //     database:"books"
// // })

// //creating routes
// app.get("/",(req,res)=>{
//     res.json("Hello, this is the backend")
// })

// app.get("/hotels", (req, res)=>{
//     const q = "SELECT * FROM hotels"
//     db.query(q, (err, data) => {
//         if(err) return res.json(err)
//         return res.json(data)
//     }) 
// })



// // app.post("/hotels", (req, res) => {
// //     const q = "INSERT INTO books (`title`, `desc`, `cover`, `price`) VALUES (?)"

// //     const values = [
// //         req.body.title,
// //         req.body.desc,
// //         req.body.cover,
// //         req.body.price
// //     ]

// //     db.query(q, [values], (err, data) => {
// //         if(err) return res.json(err)
// //         return res.json(data)
// //     })

// // })

// app.post('/newuser', (req, res) => {
    

// })


// app.listen(5000, ()=> {
//     console.log("server is running")
// })