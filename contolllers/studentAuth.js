const { Student, validate } = require("../models/student");
const Token = require("../models/token");
const Book = require('../models/book')
const sendEmail = require("../utils/email");
const IssueRequest = require("../models/issueRequest")
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ReIssueRequest=require('../models/reIssueRequest')
const moment = require('moment');

require("dotenv").config();

const getUser = async (req, res) => {
  try {
    const user = await Student.findOne({$and: [{ _id:req.user._id}, { verified: true }]}).select('-password -verified -__v').populate('issuedBooks notification');
    if(user){
      res.status(200).json({
        status: "success",
        message: "Used loged in",
        user,
        authorized:true
      });
    }
    else{
      res.status(401).json({
        status: "failed",
        message: "No user found",
        authorized:false
      });
    }
  } catch (error) {
    console.log(error);
    res.status(401).json({
      status: "failed",
      message: "No user found",
      authorized:false
    });
  }
};

const Register = async (req, res) => {
  let user = await Student.findOne({
    $and: [{ email: req.body.email }, { verified: true }],
  });
  if (user) {
    return res.status(400).json({
      status: "failed",
      message: "User with given email already exist!",
    });
  } else {
    user = await Student.findOne({
      $and: [{ roll: req.body.roll }, { verified: true }],
    });
    if (user)
      return res.status(400).json({
        status: "failed",
        message: "User with given roll no. already exist!",
      });
    else {
      try {
        const { fname, lname, roll, series, dept, email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);
        user = await Student.findOne({
          $or: [
            { $and: [{ email: req.body.email }, { verified: false }] },
            { $and: [{ roll: req.body.roll }, { verified: false }] },
          ],
        });
        if (user) {
          user = await Student.findByIdAndUpdate(
            { _id: user._id },
            { $set: { fname, lname, roll, series, dept, email, password:hashPassword } },
            { new: true, useFindAndModify: false }
          );
        } else {
          user = await new Student({
            fname,
            lname,
            roll,
            series,
            dept,
            email,
            password:hashPassword,
          }).save();
        }

        console.log(user);

        const random = Math.floor(Math.random() * 90000) + 10000;
        const encryptedCode = await bcrypt.hash(random.toString(), 10);

        let token = await new Token({
          userId: user._id.toString(),
          token: encryptedCode,
        }).save();

        const message = `<h2>Your varification code is lib-<u>${random}</u>. It will expire in 5 minutes</h2>`;
        await sendEmail(user.email, "Verification Code Email", message);
        const VarifyToken = jwt.sign(
          { userID: user._id },
          process.env.JWT_VARITY_TOKEN_KEY,
          { expiresIn: "10m" }
        );
        res.status(201).json({
          status: "success",
          message: "An Email sent to your account please verify",
          VarifyToken,
        });

        
      } catch (error) {
        console.log(error);
        res
          .status(400)
          .json({ status: "failed", message: "Unable to Register" });
      }
    }
  }
};

const VerifyRegister = async (req, res) => {
  try {
    let user = await Student.findOne({ _id: req.body.id });
    if (!user)
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid User" });

    let token = await Token.find({
      userId: user._id,
    })
      .sort({ expire_at: -1 })
      .limit(2)
      .select("userId token -_id").populate('userId','_id email');
    console.log(token);

    if (token.length==0) 
      return res.status(400).json({
        status: "failed",
        message: "Token expired and please try again.",
      });
    let i = 0;
    let flag = false;
    while (i < token.length) {
      flag = await bcrypt.compare(req.body.token.toString(), token[i].token);
      if (flag) {
        break;
      }
      i++;
    }
    if (!flag)
      return res.status(400).json({
        status: "failed",
        message: "You entered wrong varification code",
      });
      
      user = await Student.findByIdAndUpdate(
        { _id: token[0].userId._id},
        { $set: { verified:true } },
        { new: true, useFindAndModify: false })

      const RefreshToken = jwt.sign({ userID: token[0].userId._id,email:token[0].userId.email, role:"student" }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '1d' })
      const AccessToken = jwt.sign({ userID: token[0].userId._id ,email:token[0].userId.email,  role:"student" }, process.env.JWT_ACCESS_SECRET_KEY, { expiresIn: '31s' })

      res.cookie("refreshToken", RefreshToken, {

          httpOnly: true,
          sameSite: 'none',
          maxAge: 24 * 60 * 60 * 1000,
          // signed: true,
          secure: true
        });
       
      res.status(201).json({ status: "success", message: "Registration Successful" ,AccessToken});
  
  } catch (error) {
    res.status(400).send(error, "An error occured");
  }
};


const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (email && password) {
      const user = await Student.findOne({ $and: [{ email: req.body.email }, { verified: true }] })
      if (user != null) {
        const isMatch = await bcrypt.compare(password, user.password)
        if ((user.email === email) && isMatch) {
          // Generate JWT Token
          const RefreshToken = jwt.sign({ userID:user._id,email:user.email, role:"student" }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: '1d' })
          const AccessToken = jwt.sign({ userID: user._id ,email:user.email,  role:"student" }, process.env.JWT_ACCESS_SECRET_KEY, { expiresIn: '31s' })
    
          res.cookie("refreshToken", RefreshToken, {
    
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
}


const userLogout = async (req, res) => {
  try{
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {return res.status(400).json({ "status": "failed", "message": "Unable to Logout" });}
  else{res.clearCookie("refreshToken");
      
  return res.status(200).json({ "status": "success", "message": "Successfully Logout" });
  }  
}
catch(error){
  return res.status(400).json({ "status": "failed", "message": "Unable to Logout" });}
}



const changeUserPassword = async (req, res) => {
  const {old_password, new_password, password_confirmation } = req.body
  let user= await Student.findOne({_id:req.user._id})
  const isMatch = await bcrypt.compare(old_password, user.password);
  if(!isMatch) return res.status(400).json({ "status": "failed", "message": "You entered wrong password" })
  if (new_password && password_confirmation) {
    if (new_password!== password_confirmation) {
      res.status(400).json({ "status": "failed", "message": "New Password and Confirm New Password doesn't match" })
    } else {
      const salt = await bcrypt.genSalt(10)
      const newHashPassword = await bcrypt.hash(new_password, salt)
      await Student.findByIdAndUpdate(req.user._id, { $set: { password: newHashPassword } })
      res.status(201).json({ "status": "success", "message": "Password changed succesfully" })
    }
  } else {
    res.status(400).json({ "status": "failed", "message": "All Fields are Required" })
  }
}

const sendUserPasswordResetEmail = async (req, res) => {
  const { email } = req.body
  if (email) {
    const user = await Student.findOne({ email: email })
    if (user) {
      const secret = user._id + process.env.JWT_REFRESH_SECRET_KEY
      const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '15m' })
      const link = `http://localhost:3000/login/forget-password/password_reset/${user._id}/${token}`
      // // Send Email
      const message = `<a href=${link}>Click Here</a> to Reset Your Password`;
        await sendEmail(user.email, "Password Reset Email", message);

      res.status(200).json({ "status": "success", "message": "Password Reset Email Sent... Please Check Your Email" })
    } else {
      res.status(400).json({ "status": "failed", "message": "Email doesn't exists" })
    }
  } else {
    res.status(400).json({ "status": "failed", "message": "Email Field is Required" })
  }
}

const userPasswordReset = async (req, res) => {
  const { new_password, password_confirmation } = req.body
  const { id, token } = req.params
  const user = await Student.findById(id)
  const new_secret = user._id + process.env.JWT_REFRESH_SECRET_KEY
  try {
    jwt.verify(token, new_secret);
    if (new_password && password_confirmation) {
      if (new_password !== password_confirmation) {
        return res.status(400).json({ "status": "failed", "message": "New Password and Confirm New Password doesn't match" })
      } else {
        const salt = await bcrypt.genSalt(10)
        const newHashPassword = await bcrypt.hash(new_password, salt)
        await Student.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } })
        return res.status(201).json({ "status": "success", "message": "Password Reset Successfully" })
      }
    } else {
      return res.status(400).json({ "status": "failed", "message": "All Fields are Required" })
    }
  } catch (error) {
    console.log(error)
    res.status(400).json({ "status": "failed", "message": "Invalid Token" })
  }
}

const issueBookRequest=async(req,res)=>{
  let book = await Book.findOne({_id:req.body.bookID});
  let user = await Student.findOne({$and: [{ _id:req.body.userID}, { verified: true }]}).select('-password -verified -__v');
  let issueReqBook = await IssueRequest.find({userID:req.body.userID,bookID:req.body.bookID});
   if(issueReqBook.length!=0){
    console.log(issueReqBook);
    return res.status(400).json({ "status": "failed", "message": "You already request for this book." });

  }
   issueReqBook = await IssueRequest.find({userID:req.body.userID});

  if(!book){
    return res.status(400).json({ "status": "failed", "message": "This Book is not found" });
  }

  
  else if(issueReqBook.length>=3){
    return res.status(400).json({ "status": "failed", "message": "You can't issue a book this time.You have reached the maximum number of issued books." });
  }
  else if(book.number_of_books=== 0){
    return res.status(400).json({ "status": "failed", "message": "This book is not avaiable right now" });

  }
  else if(!user){
    return res.status(400).json({ "status": "failed", "message": "User not found" });

  }
  else{
    try{
      let avaiableBooks= book.number_of_books_available-1;
    let bookIds= book.book_id;
    let bookId =bookIds.pop();
    book = await Book.findByIdAndUpdate(req.body.bookID, { $set: { number_of_books_available: avaiableBooks, book_id:bookIds} })
     issueReqBook = await new IssueRequest({userID:req.body.userID,bookID:req.body.bookID,bookName:book.name,bookAuthor:book.author,bookCoverId:book.cover_image_id,roll:user.roll,book_recognized_id:bookId}).save();
     user = await Student.findByIdAndUpdate(
      { _id: user._id },
      { $push: { issuedBooks: issueReqBook._id  } },
      { new: true }
    )
    return res.status(200).json({ "status": "Success", "message": "Successfully Send Issue Request" });

  }
    catch(error){
      return res.status(400).json({ "status": "failed", "message": "Something went wrong in sending Issue request" });

    }
    
  }

}


const reIssueBookRequest=async(req,res)=>{
 
  let issueReqBook = await IssueRequest.findOne({_id:req.body.requestID,request_accepted:true});

  if(!issueReqBook){
    
    return res.status(400).json({ "status": "failed", "message": "You have to first issue this book." });

  }
  let reIssueReqBook=await ReIssueRequest.findOne({issueID:issueReqBook._id,});
  if(reIssueReqBook){
    
    return res.status(400).json({ "status": "failed", "message": "You already send a request." });

  }

    try{
   
      reIssueReqBook = await new ReIssueRequest({userID:issueReqBook.userID, issueID:issueReqBook._id, bookID:issueReqBook.bookID}).save();
     
    return res.status(200).json({ "status": "Success", "message": "Successfully Send Re-Issue Request" });

  }
    catch(error){
      return res.status(400).json({ "status": "failed", "message": "Something went wrong in sending Re-Issue request" });

    }
    
  

}

const findSemBooks=async(req,res)=>{
  const {dept,sem}=req.params;
  if(!dept||!sem){
    return res.status(400).json({status:"failed",message:"filled your search field"})
  }

  try{
    let books= await Book.find({tag_of_book:{ "$in" :[dept]}, semester:{ "$in" :[Number(sem)]}});
   if(books.length>0){
    return res.status(200).json({status:"success",message:"Books found",books})

   }
   else{
    return res.status(400).json({status:"failed",message:"Books not found"})

   }
  }catch(e){
   
  return res.status(400).json({status:"success",message:"Books not found"});
  }
}


const findBooks=async(req,res)=>{
  if(req.body.searchTerm=='all'){
    try{
      let books= await Book.find().limit(20);
    return res.status(200).json({status:"success",message:"Books found",books})
    }catch(e){
     
    return res.status(400).json({status:"success",message:"Books not found"});
    }
    
  }
  if(req.body.searchTerm==''){
    return res.status(400).json({status:"failed",message:"filled your search field"})
  }

  try{
    let books= await Book.find({ name :new RegExp('^' +req.body.searchTerm, 'i') }).limit(20);
   if(books.length>0){
    return res.status(200).json({status:"success",message:"Books found",books})

   }
   else{
    return res.status(400).json({status:"failed",message:"Books not found"})

   }
  }catch(e){
   
  return res.status(400).json({status:"success",message:"Books not found"});
  }
}

module.exports = {
  getUser,
  Register,
  VerifyRegister,
  userLogin,
  userLogout,
  changeUserPassword,
  sendUserPasswordResetEmail,
  userPasswordReset,
  issueBookRequest,
  reIssueBookRequest,
  findBooks,
  findSemBooks
};
