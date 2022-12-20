const fs = require('fs');
const express = require("express");
const SemResult= require('../models/semResult');
const CtResult= require('../models/ctResult')

const router = express.Router();
const bcrypt = require('bcrypt');
var XLSX = require("xlsx");

var multer      = require('multer');  
var path        = require('path');  
var storage = multer.diskStorage({  
destination:(req,file,cb)=>{  
cb(null,`${__dirname}/excelFiles`);  
}, 
filename:(req,file,cb)=>{
    const ext = path.extname(file.originalname); 
    const fileName=file.originalname.replace(ext,"").toLocaleLowerCase().split(" ").join("-")+"-"+Date.now();
    cb(null,fileName+ext);
}, 
 
});  
var upload = multer({storage:storage});  
 


// Upload excel file and import to mongodb
router.post('/upload-result/', upload.single("excel"), (req, res) =>{
const path= `${__dirname}/excelFiles/` + req.file.filename;
const {series,semester,dept}=req.body;
var workbook = XLSX.readFile(path);
var sheet_name_list = workbook.SheetNames;

sheet_name_list.forEach( function (y) {
  var worksheet = workbook.Sheets[y];
  //getting the complete sheet
  // console.log(worksheet);

  var headers = {};
  var data = [];
  for (z in worksheet) {
    if (z[0] === "!") continue;
    //parse out the column, row, and value
    var col = z.substring(0, 1);
    // console.log(col);

    var row = parseInt(z.substring(1));
    // console.log(row);

    var value = worksheet[z].v;
    // console.log(value);

    //store header names
    if (row == 1) {
      headers[col] = value;
      // storing the header names
      continue;
    }

    if (!data[row]) data[row] = {};
    data[row][headers[col]] = value;
  }
  //drop those first two rows which are empty
  data.shift();
  data.shift();

  for (let i = 0; i < data.length; i++) {
    data[i].series=series;
    data[i].semester=semester;
    data[i].dept=dept;

  }
//   console.log(data);


SemResult.insertMany(data).then(function(docs){


    // console.log('All user documents are saved to the database', docs);
    fs.unlinkSync(path);
    res.status(200).json({
        status: "success",
        message: "uploaded successfully",
      });

})
.catch(function(err){
    
    console.error('Error Occurred: ', err.message);
    res.status(400).json({
        status: "Failed",
        message: "Can't upload",
      });
    
});



});



});







router.post('/upload-ct-result/', upload.single("excel"), (req, res) =>{
    const path= `${__dirname}/excelFiles/` + req.file.filename;
    const {series,semester,dept,courseTitle}=req.body;
    var workbook = XLSX.readFile(path);
    var sheet_name_list = workbook.SheetNames;
    
    sheet_name_list.forEach( function (y) {
      var worksheet = workbook.Sheets[y];
      //getting the complete sheet
      // console.log(worksheet);
    
      var headers = {};
      var data = [];
      for (z in worksheet) {
        if (z[0] === "!") continue;
        //parse out the column, row, and value
        var col = z.substring(0, 1);
        // console.log(col);
    
        var row = parseInt(z.substring(1));
        // console.log(row);
    
        var value = worksheet[z].v;
        // console.log(value);
    
        //store header names
        if (row == 1) {
          headers[col] = value;
          // storing the header names
          continue;
        }
    
        if (!data[row]) data[row] = {};
        data[row][headers[col]] = value;
      }
      //drop those first two rows which are empty
      data.shift();
      data.shift();
    
      for (let i = 0; i < data.length; i++) {
        data[i].series=series;
        data[i].semester=semester;
        data[i].dept=dept;
        data[i].courseTitle=courseTitle;
    
      }
    //   console.log(data);
    
    
    CtResult.insertMany(data).then(function(docs){
    
    
        // console.log('All user documents are saved to the database');
        fs.unlinkSync(path);
        res.status(200).json({
            status: "success",
            message: "uploaded successfully",
          });
    
    })
    .catch(function(err){
        
        console.error('Error Occurred: ', err.message);
        res.status(400).json({
            status: "Failed",
            message: "Can't upload",
          });
        
    });
    
    
    
    });
    
    
    
    });


module.exports = router;