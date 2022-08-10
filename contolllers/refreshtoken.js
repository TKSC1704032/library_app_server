const {Student} =require("../models/student");
require("dotenv").config();
const jwt =require("jsonwebtoken");
 const refreshToken = async(req, res) => {
    try {
        const refreshToken = req.cookies.userRefreshToken;
        if(!refreshToken) return res.status(401).json({ "status": "failed", "message": "Unauthorized User, No Token" });
            // console.log(refreshToken);
      const {userID,email} =jwt.verify(refreshToken,process.env.JWT_REFRESH_SECRET_KEY);
      let user= await Student.findOne({_id:userID}).select('-password')      
      if(!user) return res.status(401).json({ "status": "failed", "message": "Wrong token" });
      const AccessToken = jwt.sign({userID: user._id ,email:user.email,  role:"student"},process.env.JWT_ACCESS_SECRET_KEY,{
                expiresIn: '1d'
            });

            
            res.status(200).json({"status": "success", "message": "Refresh token", AccessToken });
        }
    
    catch (error) {
        console.log(error);
        res.status(401).json({ "status": "failed", "message": "Something went wrong" });
    }
}
module.exports = refreshToken;