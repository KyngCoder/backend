require("dotenv").config({
  path: "./config.env",
});
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app  = express();

const userRouter = require('./routes/userRouter');

app.options('*', cors(['http://localhost:5173']));

app.use(cors(['http://localhost:5173']));
app.use(express.json());

app.use(express.urlencoded());

app.use("/api/v1/users", userRouter);



const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, (req, res) => {
    console.log(`Server is running on port ${PORT}`);
});

server()
