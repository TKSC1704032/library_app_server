require("dotenv").config();
const connection = require("./db/db");
const router = require("./routes/students");
const result = require("./routes/result");

const admin = require('./routes/admin')
const express = require("express");
const cors=  require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const moment = require('moment');
var bodyParser  = require('body-parser');  

(async () => await connection())();

app.use(express.json());
app.use(bodyParser.urlencoded({extended:false}));  

app.use(cors(
    {
        origin: ["https://ruetonlinelibrary.netlify.app","http://localhost:3000"],
        methods: ["GET", "POST", "DELETE"],
        credentials: true,
        origin: true,
      }))
    

app.use(cookieParser());
app.use("/api/student/", router);
app.use("/api/admin/", admin);
app.use("/api/result/", result);
app.get("/",(req,res)=>{res.send('hello')})
const port = process.env.PORT || 8080;
app.listen(port, () => {

    console.log(`Listening on port ${port}...`);

}
);