const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const {Sequelize} = require("sequelize");
const {postgresClient} = require("./db/postgres");
const {alterSync, forceSync} = require('./db/sync');

const {globalErrorHandler, requestLogger} = require("./middleware/log")

const app = express();
const port = process.env.PORT || 3001;

// POSTGRESQL
// Setting Up Database and Models: 

try{
  postgresClient.authenticate();
  console.log("Connection has been established succesfully");
}catch(err){
    console.log("Unable to connect to the database", err);
}

try{
  alterSync(postgresClient);
  console.log("Models have been synced succesfully");
}catch(error){
  console.log("An error occurred while trying to sync models: ", error);
}

// CORS
app.use(cors());
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

// BODY PARSER
app.use(express.static("public"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// LISTEN
app.listen(port, () => console.log("Listening at port " + port));

// Error and Request logging middleware
app.use(globalErrorHandler);
app.use(requestLogger);

// ROUTES
const taskRoutes = require('./routes/tasks');
app.use('/task', taskRoutes);

// TEST
app.get("/test", async (req, res) => {
  return res.json({ "Message": "Application is RUNNING!!!" });
});
