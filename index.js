require("dotenv").config();
const connection = require("./db/db");
const router = require("./routes/students");
const admin = require('./routes/admin')
const express = require("express");
const cors=  require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const moment = require('moment');

(async () => await connection())();

app.use(express.json());

app.use(cors({ credentials:true}));

app.use(cookieParser());
app.use("/api/student/", router);
app.use("/api/admin/", admin);
app.get("/",(req,res)=>{res.send('hello')})
const port = process.env.PORT || 8080;
app.listen(port, () => {

    console.log(`Listening on port ${port}...`);

}
);