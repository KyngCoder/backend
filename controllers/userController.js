const conn = require("../db");

const parseError = require("../common/parseErrors");


exports.getAllUser = parseError( (req, res, next) => {
    const strQuery = "SELECT * FROM user";
    conn.query(strQuery, (err, users) => {
      if (err) return next(err);
      if (!users.length) res.status(400).json({ message: "No user found" });
      res.status(200).json({
        message: "Success",
        data: users,
      });
    });
  });
