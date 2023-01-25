const fs = require('fs');
const express = require("express");
const SemResult= require('../models/semResult');
const CtResult= require('../models/ctResult')
const Teacher =require('../models/teacherModel')
const router = express.Router();
const bcrypt = require('bcrypt');
var XLSX = require("xlsx");
const jwt = require("jsonwebtoken");


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
console.log(series,semester,dept);
console.log(req.file)
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
    console.log(req.file);
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
      console.log(data);
    
    
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





    router.post('/get-ct-result/', (req, res) =>{
      const {series,semester,dept,roll,courseTitle}=req.body;
      const details = {series:"",semester:"",dept:"",roll:"",courseTitle:""};
      details.series=series;
      details.semester=semester;
      details.dept=dept;
      details.roll=roll;
      details.courseTitle=courseTitle;



      for (const prop in details) {
        if((typeof details[prop] == "undefined")||(details[prop] =='')){
          delete details[prop];
        }

      }
      if(Object.keys(details).length>0){
      
        CtResult.find(details).then(function(docs){
      
          // console.log('All user documents are saved to the database', docs);
          res.status(200).json({
              status: "success",
              message: "CT Result Found",
              results:docs
            });
      
      })
      .catch(function(err){
          
          console.error('Error Occurred: ', err.message);
          res.status(400).json({
              status: "Failed",
              message: "Can't find",
            });
          
      });

      }
      else{
        res.status(400).json({
          status: "Failed",
          message: "All fields you enter are empty. Plz fill it.",
        });
      }
      
      
      
      
      
      });
      
      
      
      

      router.post('/get-result/', (req, res) =>{
        const {series,semester,dept,roll}=req.body;
        const details = {series:"",semester:"",dept:"",roll:""};
        details.series=series;
        details.semester=semester;
        details.dept=dept;
        details.roll=roll;
  
  
        for (const prop in details) {
          if((typeof details[prop] == "undefined")||(details[prop] =='')){
            delete details[prop];
          }
  
        }
        if(Object.keys(details).length>0){
        
          SemResult.find(details).then(function(docs){
        
            // console.log('All user documents are saved to the database', docs);
            res.status(200).json({
                status: "success",
                message: "Result Found",
                results:docs
              });
        
        })
        .catch(function(err){
            
            console.error('Error Occurred: ', err.message);
            res.status(400).json({
                status: "Failed",
                message: "Can't find",
              });
            
        });
  
        }
        else{
          res.status(400).json({
            status: "Failed",
            message: "All fields you enter are empty. Plz fill it.",
          });
        }
        
        
        
        
        
        });
        
        
   
        router.post('/upload-result-manually/', async (req, res) =>{
          const {series,semester,dept,roll,gp,semesterEarnCredit,gpa,totalEarnCredit,cgpa,failedSubject}=req.body;
          const details = {series:"",semester:"",dept:"",roll:""};
          details.series=series;
          details.semester=semester;
          details.dept=dept;
          details.roll=roll;
    
    
          for (const prop in details) {
            if((typeof details[prop] == "undefined")||(details[prop] =='')){
              delete details[prop];
            }
    
          }
          if(Object.keys(details).length>0){
          try{
            let result = await SemResult.findOne(details);
            if(result){
              result = await SemResult.findByIdAndUpdate(
                { _id: result._id },
                { $set: { gp,semesterEarnCredit,gpa,totalEarnCredit,cgpa,failedSubject } },
                { new: true, useFindAndModify: false }
              );
              
            }

            else{

              result = await new SemResult({
                series,semester,dept,roll,gp,semesterEarnCredit,gpa,totalEarnCredit,cgpa,failedSubject
              }).save();
              
            }

            res.status(200).json({
              status: "success",
              message: "Result Updated",
              results:result
            });
            }    
          catch(err){
              
              console.error('Error Occurred: ', err.message);
              res.status(400).json({
                  status: "Failed",
                  message: "Can't Update",
                });
              
          };
    
          }
          else{
            res.status(400).json({
              status: "Failed",
              message: "All fields you enter are empty. Plz fill it.",
            });
          }
          
          });
       
          

          router.post('/upload-ct-result-manually/', async (req, res) =>{
            const {series,semester,dept,courseTitle,roll,CT1,CT2,CT3,CT4,attendance}=req.body;
            const details = {series:"",semester:"",dept:"",roll:"",courseTitle:""};
            details.series=series;
            details.semester=semester;
            details.dept=dept;
            details.roll=roll;
            details.courseTitle=courseTitle;
      
      
            for (const prop in details) {
              if((typeof details[prop] == "undefined")||(details[prop] =='')){
                delete details[prop];
              }
      
            }
            if(Object.keys(details).length>0){
            try{
              let result = await CtResult.findOne(details);
              if(result){
                result = await CtResult.findByIdAndUpdate(
                  { _id: result._id },
                  { $set: { CT1,CT2,CT3,CT4,attendance:attendance } },
                  { new: true, useFindAndModify: false }
                );
                
              }
  
              else{
  
                result = await new CtResult({
                  series,semester,dept,courseTitle,roll,CT1,CT2,CT3,CT4, attendance
                }).save();
                
              }
  
              res.status(200).json({
                status: "success",
                message: "Result Updated",
                results:result
              });
              }    
            catch(err){
                
                console.error('Error Occurred: ', err.message);
                res.status(400).json({
                    status: "Failed",
                    message: "Can't Update",
                  });
                
            };
      
            }
            else{
              res.status(400).json({
                status: "Failed",
                message: "All fields you enter are empty. Plz fill it.",
              });
            }
            
            });  
            



            router.post('/add-teacher/', async (req, res) => {
             
           try{
              
            const {name, designation, dept, email,password}=req.body;
              const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(password, salt);
        user = await Teacher.findOne({email});
        if (user) {
          user = await Teacher.findByIdAndUpdate(
            { _id: user._id },
            { $set: { designation, dept, email, password:hashPassword } },
            { new: true, useFindAndModify: false }
          );
        } else {
          user = await new Teacher({
            name, designation, dept, email,password:hashPassword,
          }).save();
        }

        res.status(200).json({
          status: "success",
          message: "Account Created",
         
        });
           }
           catch(e){
            res.status(400).json({
              status: "Failed",
              message: "Request Failed"
            });
           }
              

            })
            



            router.post('/teacher-login/', async (req, res) => {
              try {
                const { email, password } = req.body
                if (email && password) {
                  const user = await Teacher.findOne({ email: req.body.email })
                  if (user != null) {
                    const isMatch = await bcrypt.compare(password, user.password)
                    if ((user.email === email) && isMatch) {
                      // Generate JWT Token
                      const AccessToken = jwt.sign({ userID: user._id ,email:user.email,  role:"teacher" }, process.env.JWT_ACCESS_SECRET_KEY, { expiresIn: '1d' })
                
                      res.cookie("teacherToken", AccessToken, {
                
                          httpOnly: true,
                          sameSite: 'none',
                          maxAge: 24 * 60 * 60 * 1000,
                          // signed: true,
                          secure: true
                        });
                         
                      res.status(201).json({ status: "success", message: "Login Successful" ,AccessToken});
            
                    } else {
                      res.send({ "status": "failed", "message": "Email or Password is not Valid" })
                    }
                  } else {
                    res.send({ "status": "failed", "message": "You are not a Registered User" })
                  }
                } else {
                  res.send({ "status": "failed", "message": "All Fields are Required" })
                }
              } catch (error) {
                console.log(error)
                res.send({ "status": "failed", "message": "Unable to Login" })
              }
            })
            
            router.get('/get-teacher/', async(req, res) => {
              try {
                  const teacherToken = req.cookies.teacherToken;
                  if(!teacherToken) return res.status(401).json({ "status": "failed", "message": "Unauthorized User, No Token" });
                      // console.log(refreshToken);
                const {userID,email} =jwt.verify(teacherToken,process.env.JWT_ACCESS_SECRET_KEY);
                let user= await Teacher.findOne({_id:userID}).select('-password')      
                if(!user) return res.status(401).json({ "status": "failed", "message": "Wrong token" });
            
                      
                      res.status(200).json({"status": "success", "message": "authorized user", userID,email });
                  }
              
              catch (error) {
                  console.log(error);
                  res.status(401).json({ "status": "failed", "message": "Something went wrong" });
              }
            })
            
            router.post ('/teacherlogout/',async (req, res) => {
              try{
              const teacherToken = req.cookies.teacherToken;
              if (!teacherToken) {return res.status(400).json({ "status": "failed", "message": "Unable to Logout" });}
              else{res.clearCookie("teacherToken");
                  
              return res.status(200).json({ "status": "success", "message": "Successfully Logout" });
              }  
            }
            catch(error){
              return res.status(400).json({ "status": "failed", "message": "Unable to Logout" });}
            })
            



module.exports = router;