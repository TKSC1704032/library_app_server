const fs =require('fs');
const sendEmail = require("../utils/email");
const Token = require("../models/token");
const { Student, validate } = require("../models/student");
const {getUser,findBooks, findSemBooks,Register ,VerifyRegister,userLogin,userLogout ,changeUserPassword,sendUserPasswordResetEmail, userPasswordReset,issueBookRequest,reIssueBookRequest}= require("../contolllers/studentAuth");
const refreshToken =require('../contolllers/refreshtoken')
const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const checkUserAuth = require('../middleware/auth_middleware') ; 
const cloudinary = require("../utils/cloudinary");
const upload =  require("../utils/multer")
const {bookPost} =require('../contolllers/adminController')

// ROute Level Middleware - To Protect Route
// router.use('/getuser/',checkUserAuth);
// router.use('/changepassword/', checkUserAuth)
// router.use('/change-avatar/', checkUserAuth)
// router.use('/remove-avatar/:id/', checkUserAuth)

//public routes
router.post("/register/",Register);
router.post("/register/verify/",VerifyRegister);
router.post("/login/",userLogin);
router.post("/logout/",userLogout);
router.post('/send-reset-password-email/', sendUserPasswordResetEmail);
router.post('/reset-password/:id/:token/', userPasswordReset);
router.post("/refresh-token/",refreshToken);
router.post("/refresh-token/",refreshToken);
router.post("/find-books/",findBooks);
router.get("/find-sem-books/:dept/:sem/",findSemBooks);


//private routes
router.get('/getuser/:userID',getUser);
router.post('/changepassword/:userID',changeUserPassword);
router.post("/issue-book-request/",issueBookRequest);
router.post("/re-issue-book-request/",reIssueBookRequest);
router.post('/change-avatar/',upload.single('avatar'),async(req,res)=>{
    try {
        // Upload image to cloudinary
        let user= await Student.findOne({_id:req.body.userID});
        if(!user){return  res.status(400).json({
                status: "failed",
                message: "This user has no account!",
              });
        }
        if(user.cloudinary_id!=''){
          await cloudinary.uploader.destroy(user.cloudinary_id);
        }
        
        const result = await cloudinary.uploader.upload(req.file.path,{ use_filename : true, unique_filename :false});
          console.log(result);
        // Create new user

        user = await Student.findByIdAndUpdate(
            { _id: user._id },
            { $set: { avatar: result.secure_url,cloudinary_id: result.public_id} },
            { new: true, useFindAndModify: false }
          );
        
          res.status(200).json({
            status: "success",
            message: "Image uploaded successfully",
            userID:user._id,
            name:user.fname,
            img_url:user.avatar
          });
      } catch (err) {
        console.log(err);
        res.status(400).json({
          status: "failed",
          message: "Uploading failed!",
        });
      }

})

router.delete("/remove-avatar/:id/", async (req, res) => {
  try {
    // Find user by id
    let user = await Student.findById(req.params.id);
    // Delete image from cloudinary
    if(!user||user.avatar===''||user.cloudinary_id==''){
      return res.status(400).json({
        status: "failed",
        message: "Unable to delete the image!",
      });
    }
    await cloudinary.uploader.destroy(user.cloudinary_id);
    // Delete user from db
    user = await Student.findByIdAndUpdate(
      { _id: user._id },
      { $set: { avatar:'',cloudinary_id: ''} },
      { new: true, useFindAndModify: false }
    );
    res.status(200).json({
      status: "success",
      message: "Successfully deleted the image!",
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({
      status: "failed",
      message: "Unable to delete the image!",
    });
  }
});




module.exports = router;