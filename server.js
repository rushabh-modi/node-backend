require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const { logger } = require("./middleware/logEvents");
const errorHandler = require("./middleware/errorHandler");
const verifyJWT = require("./middleware/verifyJWT");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");
const mongoose = require("mongoose");
const connectDB = require("./config/dbConn");
const port = 4000;

//Database
connectDB();

//custom middleware logger
app.use(logger);

//fetches cookies credentials requirement
app.use(credentials);

//cors
app.use(cors(corsOptions));

// built-in middleware to handle urlencoded - form data: 'content-type: applicatison/x-www-form-urlencoded'
app.use(express.urlencoded({ extended: false }));

//build-in middleware for json
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

//serve static file
app.use(express.static(path.join(__dirname, "/public")));

//Routes
app.use("/", require("./routes/root"));
app.use("/register", require("./routes/register"));
app.use("/auth", require("./routes/auth"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));
app.use(verifyJWT); // all the routes after this line are protected with jwt
app.use("/employees", require("./routes/api/employees"));
app.use('/users', require('./routes/api/users'));

// !if path not exists
app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ error: "404 Not Found" });
  } else {
    req.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("connected to MongoDB");
  app.listen(port, () => console.log(`server started on ${port}`));
});
