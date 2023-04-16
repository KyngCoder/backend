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

// app.get('*', (req, res) => {})

// error handling for non-existing routes
// app.use((req, res, next) => {
//   const error = new Error('Not found');
//   error.status = 404;
//   next(error);
// });

// // define an error handler middleware
// app.use((err, req, res, next) => {
//   res.status(err.status || 500);
//   res.json({
//     error: {
//       message: err.message
//     }
//   });
// });

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
    res.json("Welcome... this is our API. This is a simple way to check if the api is working.")
})

app.get("/user", (req, res)=>{
    const q = "SELECT * FROM user"
    db.query(q, (err, data) => {
        if(err) return res.json(err)
        return res.json(data)
    }) 
})

// request to get a specific user
app.get("/user/:id", (req, res) => {
    const q = "SELECT * FROM user WHERE id = ?"

    db.query(q, [req.params.id], (err, data) => {
        if(err) {
          console.log(err)
          res.status(500).send({error: err})
        }

        if(data.length == 0) {

          res.status(500).send({error: "User with this ID doesn't exist"})
          
        }else {
          res.status(200).send({data: data})
        }
    } )
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


  // create a route to handle POST requests to create a new property
app.post('/createProperty', (req, res) => {
  const property = req.body;
  console.log(property)
  // insert the location details into the location table
  const locationQuery = `INSERT INTO location (longitude, latitude, street_address, location_name) VALUES (?, ?, ?, ?)`;
  const locationValues = [property.location.longitude, property.location.latitude, property.location.street_address, property.location.location_name];
  
  db.query(locationQuery, locationValues, (err, locationResult) => {
    if (err) {
      console.error('Error inserting location details into location table:', err);
      res.status(500).send('Error creating property.');
    } else {
      const locationId = locationResult.insertId;
      
      // insert the property details into the property table, using the locationId as a foreign key
      const propertyQuery = `INSERT INTO property (property_name, description, ratings, property_type, image, updated_at,num_rooms, location_id) VALUES (?, ?, ?, ?, ?, NOW(), ?, ? )`;
      const propertyValues = [property.property_name, property.description, property.ratings, property.property_type, property.image, property.num_rooms, locationId  ];
      
      db.query(propertyQuery, propertyValues, (err, propertyResult) => {
        if (err) {
          console.error('Error inserting property details into property table:', err);
          res.status(500).send('Error creating property.');
        } else {
          console.log('Property created successfully!');
          res.send('Property created successfully!');
        }
      });
    }
  });
});

app.get('/properties', (req, res) => {
  const query = `SELECT property.*, location.* FROM property INNER JOIN location ON property.location_id = location.id `;
  db.query(query, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error retrieving properties');
    } else {
      const properties = results.map(result => {
        const { id, property_name, description, ratings, property_type, image, has_owner, owner_details, location_id, longitude, latitude, street_address,num_rooms, location_name, created_at, updated_at } = result;
        return {
          id,
          property_name,
          description,
          ratings,
          property_type,
          image,
          has_owner,
          owner_details,
          num_rooms,
          location: {
            id: location_id,
            longitude,
            latitude,
            street_address,
            location_name
          },
          created_at,
          updated_at
        };
      });
      res.json(properties);
    }
  });
});

app.get('/amenities', (req, res) => {
  const query = "SELECT * FROM amenitieslist"

  
  db.query(query, (err, response) => {

    if(err) {
      console.log(err)
      res.status(500).send({error: "An error has occured"})
      return
      // throw err

    }else if(response.length == 0) {
      res.status(500).send({error: "An error has occured"})
    }else {
      res.status(200).send(response)
    }
  })

})

app.post('/amentity/add', (req, res) => {

  const data = req.body

  console.log(data)

  const query = "INSERT INTO amenitieslist (amenities_type, amenities_name, amenities_icon, external_price) VALUES (?,?,?,?)"

  db.query(query, [data.amenities_type, data.amenities_name, data.amenities_icon, data.external_price], (err, response) => {

    if(err) {
      console.log(err)
      res.status(500).send({error: "An error has occured"})
      return
      // throw err

    }else if(response.length == 0) {
      res.status(500).send({error: "An error has occured"})
    }else {
      res.status(200).send(response)
    }

  })
})

app.get('/amenities/:id', (req, res) => {
  const query = "SELECT * FROM amenitieslist WHERE id = ?"

  
  db.query(query, [req.params.id], (err, response) => {

    if(err) {
      console.log(err)
      res.status(500).send({error: "An error has occured"})
      return
      // throw err

    }else if(response.length == 0) {
      res.status(500).send({error: "An error has occured"})
    }else {
      res.status(200).send(response)
    }
  })

})




app.get('/properties/:id', (req, res) => {
  const query = `SELECT property.*, location.* FROM property INNER JOIN location ON property.location_id = location.id   WHERE property.id = ?`;
  db.query(query, [req.params.id] ,(error, results) => {
    if (error) {
      console.error(error);
      res.status(500).send('Error retrieving properties');
    } else {
      const properties = results.map(result => {
        const { id, property_name, description, ratings, property_type, image, has_owner, owner_details, location_id, longitude, latitude, street_address,num_rooms, location_name, created_at, updated_at } = result;
        return {
          id,
          property_name,
          description,
          ratings,
          property_type,
          image,
          has_owner,
          owner_details,
          num_rooms,
          location: {
            id: location_id,
            longitude,
            latitude,
            street_address,
            location_name
          },
          created_at,
          updated_at
        };
      });
      res.json(properties);
    }
  });
});


// route to add a new room

  
// app.post('/createRoom', (req, res) => {
//   const roomInfo = req.body;
//   const {
//     property_id,
//     floor,
//     room_type,
//     amenities_id,
//     availablity_status,
//     ratings,
//     images,
//     description,
//     base_price,
//     num_beds,
//     max_guests,
//     num_baths,
//     property_name
//   } = roomInfo;

//   console.log("room info", roomInfo);

//   const propquery = `SELECT * from property where property_name = '${property_name}'`;

//   console.log(propquery);

//   db.query(propquery, (err, result) => {
//     console.log("propquery result", result);

//     if (err) {
//       console.log(err);
//     }

//     console.log("Result is", result);
//     if (result.length == 0) {
//       console.log("nothing exist");
//       res.send("Nothing exist");
//     } else {
//       console.log(images);

//       const imageQueries = images.map(image => {
//         return new Promise((resolve, reject) => {
//           db.query('INSERT INTO propertyroom (floor, availablity_status, ratings, images, description, property_id, room_type,base_price,  num_beds, num_baths, max_guests, property_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [floor, availablity_status, ratings, Buffer.from(image, 'base64'), description, property_id, room_type,base_price, num_beds, num_baths, max_guests, property_name], (err, result) => {
//             if (err) {
//               console.log(err);
//               reject(err);
//             } else {
//               const room_id = result.insertId;
//               const amenitiesQuery = 'INSERT INTO amenities (propertyroom_id, amenitieslist_id) VALUES (?, ?)';
//               amenities_id.forEach((amenityId) => {
//                 console.log("amenityID", amenityId, room_id)
//                 db.query(amenitiesQuery, [room_id, amenityId], (err, amenitiesResult) => {
//                   console.log(amenitiesResult)
//                   if (err) {
//                     console.error(err);
//                     res.status(500).send('Error creating amenities for room');
//                     return;
//                   }else{
//                     console.log(amenitiesResult)
//                   }
//                 });
//               });
//               resolve();
//             }
//           });
//         });
//       });

//       Promise.all(imageQueries)
//         .then(() => {
//           res.status(201).json({ message: 'Room created successfully' });
//         })
//         .catch(error => {
//           console.log(error);
//           res.status(500).send('Error creating room');
//         });
//     }
//   });
// });

app.post('/createRoom', (req, res) => {
  const roomInfo = req.body;
  const {
    property_id,
    floor,
    room_type,
    amenities_id,
    availablity_status,
    ratings,
    images,
    description,
    base_price,
    num_beds,
    max_guests,
    num_baths,
    property_name
  } = roomInfo;

  const arrayOfImages = images
const imagesString = JSON.stringify(arrayOfImages);

  console.log("room info", roomInfo);

  const propquery = `SELECT * from property where property_name = '${property_name}'`;

  console.log(propquery);

  db.query(propquery, (err, result) => {
    console.log("propquery result", result);

    if (err) {
      console.log(err);
    }

    console.log("Result is", result);
    if (result.length == 0) {
      console.log("nothing exist");
      res.send("Nothing exist");
    } else {
      

      db.query('INSERT INTO propertyroom (floor, availablity_status, ratings, images, description, property_id, room_type,base_price,  num_beds, num_baths, max_guests, property_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [floor, availablity_status, ratings, imagesString, description, property_id, room_type,base_price, num_beds, num_baths, max_guests, property_name], (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Error creating room');
          return;
        }
        
        const room_id = result.insertId;
        
        const amenitiesQuery = 'INSERT INTO amenities (propertyroom_id, amenitieslist_id) VALUES (?, ?)';
        const amenityQueries = amenities_id.map((amenityId) => {
          console.log("amenityID", amenityId, room_id)
          return new Promise((resolve, reject) => {
            db.query(amenitiesQuery, [room_id, amenityId], (err, amenitiesResult) => {
              console.log(amenitiesResult)
              if (err) {
                console.error(err);
                res.status(500).send('Error creating amenities for room');
                reject(err);
              }else{
                console.log(amenitiesResult)
                resolve();
              }
            });
          });
        });
        
        Promise.all(amenityQueries)
          .then(() => {
            res.status(201).json({ message: 'Room created successfully' });
          })
          .catch(error => {
            console.log(error);
            res.status(500).send('Error creating amenities for room');
          });
      });
    }
  });
});




//get specific room

// app.get('/room', (req, res) => {
//   const roomId = req.params.property_name;
//   console.log(roomId);

//   // Query to retrieve room information
//   const roomQuery = `SELECT * FROM propertyroom WHERE id = ${roomId}`;

//   db.query(roomQuery, (roomErr, roomResult) => {
//     if (roomErr) {
//       console.error(roomErr);
//       res.status(500).send('Error retrieving room information');
//       return;
//     }

//     // Query to retrieve amenities information

//     const amenitiesQuery = `
//     SELECT amenitieslist.amenities_name
//      FROM amenities
//     JOIN amenitieslist ON amenities.amenitieslist_id = amenitieslist.id
//     WHERE amenities.propertyroom_id = ${roomId}
//    `;


//     db.query(amenitiesQuery, (amenitiesErr, amenitiesResult) => {
//       if (amenitiesErr) {
//         console.error(amenitiesErr);
//         res.status(500).send('Error retrieving amenities information');
//         return;
//       }

//       console.log(amenitiesResult)

//       const roomData = roomResult[0];
//       const amenitiesData = amenitiesResult.map((amenity) => amenity.amenities_name);
//       const responseData = {
//         ...roomData,
//         amenities: amenitiesData,
//       };
//       res.json(responseData);
//     })
//   });
// }); 

app.get('/room', (req, res) => {
  // Query to retrieve all room information
  const roomQuery = `SELECT * FROM propertyroom`;

  db.query(roomQuery, (roomErr, roomResult) => {
    if (roomErr) {
      console.error(roomErr);
      res.status(500).send('Error retrieving room information');
      return;
    }

    // Query to retrieve amenities information for all rooms
    const amenitiesQuery = `
      SELECT propertyroom_id, amenitieslist.*
      FROM amenities
      JOIN amenitieslist ON amenities.amenitieslist_id = amenitieslist.id
    `;

    db.query(amenitiesQuery, (amenitiesErr, amenitiesResult) => {
      if (amenitiesErr) {
        console.error(amenitiesErr);
        res.status(500).send('Error retrieving amenities information');
        return;
      }

      // Group the amenities by room ID
      const amenitiesData = amenitiesResult.reduce((acc, cur) => {
        const roomId = cur.propertyroom_id;
        if (!acc[roomId]) {
          acc[roomId] = [];
        }
        acc[roomId].push({
          name: cur.amenities_name,
          icon: cur.amenities_icon,
          type: cur.amenities_type,
          external_price: cur.external_price
        });
        return acc;
      }, {});

      // Combine the room data and amenities data into a single response object
      const responseData = roomResult.map((room) => ({
        ...room,
        amenities: amenitiesData[room.id] || [],
      }));
      
      res.json(responseData);
      console.log(responseData)
    });
  });
});


app.get("/room/:id", (req, res) => {

 // Query to retrieve all room information
 const roomQuery = `SELECT * FROM propertyroom WHERE id = ?`;

 db.query(roomQuery, [req.params.id], (roomErr, roomResult) => {
   if (roomErr) {
     console.error(roomErr);
     res.status(500).send('Error retrieving room information');
     return;
   }

   // Query to retrieve amenities information for all rooms
   const amenitiesQuery = `
     SELECT propertyroom_id, amenitieslist.*
     FROM amenities
     JOIN amenitieslist ON amenities.amenitieslist_id = amenitieslist.id
   `;

   db.query(amenitiesQuery, (amenitiesErr, amenitiesResult) => {
     if (amenitiesErr) {
       console.error(amenitiesErr);
       res.status(500).send('Error retrieving amenities information');
       return;
     }

     // Group the amenities by room ID
     const amenitiesData = amenitiesResult.reduce((acc, cur) => {
       const roomId = cur.propertyroom_id;
       if (!acc[roomId]) {
         acc[roomId] = [];
       }
       acc[roomId].push({
         name: cur.amenities_name,
         icon: cur.amenities_icon,
         type: cur.amenities_type,
         external_price: cur.external_price
       });
       return acc;
     }, {});

     // Combine the room data and amenities data into a single response object
     const responseData = roomResult.map((room) => ({
       ...room,
       amenities: amenitiesData[room.id] || [],
     }));
     
     res.json(responseData);
     console.log(responseData)
   });
 });
})


  
  // const { floor, availablity_status, ratings, images, description, amenities, room_type_name, base_price, property_name } = req.body;
  // const { property_id } = property_name;


  // db.query('INSERT INTO propertyroom (floor, availablity_status, ratings, images, description, amenities_id, property_id, room_type_id, base_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [floor, , ratings, images, description, amenities, property_id, room_type_name, base_price], (err, result) => {
  //   if (err) {
  //     console.log(err);
  //     res.status(500).send('Error creating room');
  //   } else {
  //     const room_id = result.insertId;
  //     res.status(201).json({ room_id });
  //   }
  // });


  // Error handing for routes that don't exist

  app.get('*', (req, res) => {

    res.status(404).send({error: "Route doesn't exist"})
  })

  app.post('*', (req, res) => {

    res.status(404).send({error: "Route doesn't exist"})
  })



app.listen(5000, ()=> {
    console.log("server is running")
})