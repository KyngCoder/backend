import cors from 'cors'
import express from 'express'
import bodyParser from 'body-parser'
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken";

import mysql from 'mysql'


const app = express()


app.use(express.json())

//so frontend can connect to backend in peace lol
app.use(cors())

app.use(bodyParser.json());
 
app.use(bodyParser.urlencoded({
    extended: true
}));

//connecting to mysql

const db = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"Diversity",
    database:"qatar-schema"
})

db.connect(function(err) {
    if (err) throw err;
    console.log('Database is connected successfully !');
  });

//creating routes
app.get("/",(req,res)=>{
    res.json("Hello, this is the backend")
})

app.get("/user", (req, res)=>{
    const q = "SELECT * FROM user"
    db.query(q, (err, data) => {
        if(err) return res.json(err)
        return res.json(data)
    }) 
})




// adds a new user
app.post('/createUser', (req, res) => {
    const { first_name, last_name, gender, date_of_birth, email_address, phone_number, nationality, language, username, password } = req.body;
  
    console.log(first_name, last_name, gender, date_of_birth, email_address, phone_number, nationality, language, password);


      // Check if username already exists in login table
  const loginSql = 'SELECT * FROM login WHERE username = ?';
  db.query(loginSql, [username], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'An error occurred' });
    }

    if (result.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

})


  
    // Check if user with email already exists
    const sql = 'SELECT * FROM user WHERE email_address = ?';
    db.query(sql, [email_address], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'An error occurred' });
      }
  
      if (result.length > 0) {
        return res.status(400).json({ error: 'User with email already exists' });
      }
  
      // Hash password and insert new user into database
      const hashedPassword = bcrypt.hashSync(password, 10);
      const insertSql = 'INSERT INTO user (email_address, first_name, last_name, gender, date_of_birth, phone_number, nationality, language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      db.query(insertSql, [email_address, first_name, last_name, gender, date_of_birth, phone_number, nationality, language,], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'An error occurred' });
        }


        //loggin user
        
        const userId = result.insertId;
        const is_admin = false

        // Insert new user into login table
        const loginInsertSql = 'INSERT INTO login (user_id, username, password, is_admin) VALUES (?, ?, ?, ?)';
        db.query(loginInsertSql, [userId, username, hashedPassword, is_admin], (err, result) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'An error occurred' });
          }

          const tokenPayload = {
            username,
            hashPassword: hashedPassword,
            user_id: userId,
            is_admin:is_admin,
          };

          const token = jwt.sign(tokenPayload, 'secret');

          return res.json({ message: 'User registered successfully', token });
        });

       
      });
    });
  });
  

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Check if user with username exists in login table
      const sql = 'SELECT * FROM login WHERE username = ?';
      db.query(sql, [username], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'An error occurred' });
        }
  
        if (result.length === 0) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
  
        const user = result[0];
   
        // Compare hashed password with password provided by user
        const isPasswordValid = bcrypt.compareSync(password, user.password);
  
        if (!isPasswordValid) {
          return res.status(400).json({ error: 'Invalid credentials' });
        }
  
        console.log(isPasswordValid)
        // Generate and return token
        const tokenPayload = {
          user_id: user.user_id,
          username: user.username
        };
  
        const token = jwt.sign(tokenPayload, 'secret');
        
        return res.json({ message: 'User logged in successfully', token });
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'An error occurred' });
    }
  });
  

app.listen(5000, ()=> {
    console.log("server is running")
})