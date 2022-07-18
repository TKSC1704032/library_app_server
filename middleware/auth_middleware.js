const jwt =require('jsonwebtoken');
require("dotenv").config();
const {Student} =require('../models/student');
const checkUserAuth = async (req, res, next) => {
  let token
  const { authorization } = req.headers
  
  if (authorization && authorization.startsWith('Bearer')) {
    try {
      // Get Token from header
      token = authorization.split(' ')[1]
      // Verify Token
      const { userID } = jwt.verify(token, process.env.JWT_ACCESS_SECRET_KEY)
      // Get User from Token
      req.user = await Student.findOne({_id:userID}).select('-password')
      next()
    } catch (error) {
      // console.log(error)
      res.status(401).json({ "status": "failed", "message": "Unauthorized User" })
    }
  }
  if (!authorization) {
    res.status(401).json({ "status": "failed", "message": "Unauthorized User, No Token" })
  }
}
module.exports = checkUserAuth;