const { Student, validate } = require("../models/student");
const Token = require("../models/token");
const sendEmail = require("../utils/email");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const getUser = async (req, res) => {
  try {
    const user = await Student.findOne({$and: [{ _id:req.user._id}, { verified: true }]}).select('-password -verified -__v');
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







module.exports = {
  getUser,
  Register,
  VerifyRegister,
  userLogin,
  userLogout,
  changeUserPassword,
  sendUserPasswordResetEmail,
  userPasswordReset
};
