const express = require ("express");
const booksRouter = require("./src/books");
const commentsRouter = require("./src/comments");

const cors = require("cors")

const server = express();

server.use(express.json())


const listEndpoints = require("express-list-endpoints");


var whitelist = ['http://localhost:3000']
var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}






const port = process.env.PORT || 5000


server.use("/books", cors(corsOptions), booksRouter); // listen for book router 

server.use("/comments", cors(corsOptions), commentsRouter); // listen for comments router



server.get("/test", (req, res) =>{
    res.send("we are live")
})







console.log(listEndpoints(server));

server.listen(port, () =>{
    console.log(`I am listening on port ${port}`)
})