require('dotenv').config();
require('express-async-errors');
const express = require('express');
const app = express();
const ejs = require('ejs');
const path = require('path');
const cors = require('cors');
const corsOptions = require('./config/corsOptions');
const { logger, logEvents } = require('./middleware/logEvents');
const errorHandler = require('./middleware/errorHandler');
// const verifyJWT = require('./middleware/verifyJWT');
const cookieParser = require('cookie-parser');
const credentials = require('./middleware/credentials');
const mongoose = require('mongoose');
const connectDB = require('./config/dbConn');

const PORT = process.env.PORT || 4000;

console.log(process.env.NODE_ENV);

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
// app.use(express.static(path.join(__dirname, '/public')));
app.use(express.static('public'));
app.set('view engine', 'ejs');

//Routes
app.use('/', require('./routes/root'));
app.use('/register', require('./routes/register'));
app.use('/auth', require('./routes/auth'));
app.use('/refresh', require('./routes/refresh'));
app.use('/logout', require('./routes/logout'));
// app.use(verifyJWT); // all the routes after this line are protected with jwt
app.use('/employees', require('./routes/api/employees'));
app.use('/users', require('./routes/api/users'));

// !if path not exists
app.all('*', (req, res) => {
  res.status(404);
  res.render('404');
});

app.use(errorHandler);

mongoose.connection.once('open', () => {
  console.log('connected to mongoDB');
  app.listen(PORT, () => console.log(`Example app listening on port ${PORT}!`));
});

mongoose.connection.on('error', (err) => {
  console.log(err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    'mongoErrLog.log'
  );
});
