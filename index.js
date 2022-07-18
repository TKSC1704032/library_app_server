require("dotenv").config();
const connection = require("./db/db");
const router = require("./routes/students");
const express = require("express");
const cors=  require("cors");
const cookieParser = require("cookie-parser");
const app = express();

(async () => await connection())();

app.use(express.json());

app.use(cors({ credentials:true, origin:'http://localhost:3000' }));

app.use(cookieParser());
app.use("/api/student/", router);
app.get("/",(req,res)=>{res.send('hello')})
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}...`));