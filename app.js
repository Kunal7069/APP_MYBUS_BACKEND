require('dotenv').config();

const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const appRoutes = require("./api/appRoutes");
const authRoutes = require("./api/authRoutes");
const app = express();
app.use(cors({
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true
}));
app.use(express.json());

const port = process.env.PORT;
const url = process.env.url;
const dbName = process.env.dbName;

let db;

MongoClient.connect(url, {})
  .then((client) => {
    db = client.db(dbName);
    console.log("Connected to MongoDB");
    
    // Pass db instance to routes
    app.use("/", appRoutes(db));
    app.use("/", authRoutes(db));
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});