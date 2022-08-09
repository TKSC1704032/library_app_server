const Book =require('../models/book');
const {Student} =require('../models/student')
const cloudinary =require('../utils/cloudinary');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const IssueRequest = require('../models/issueRequest');
const Notification = require('../models/notification');
const {authenticateGoogle,uploadToGoogleDrive,deleteFile}=require('../utils/googleDriveApi')
const ReIssueRequest=require('../models/reIssueRequest')
const moment = require('moment');
const Admin = require('../models/adminModel')

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body
    if (email && password) {
      const user = await Admin.findOne({ email: req.body.email })
      if (user != null) {
        const isMatch = await bcrypt.compare(password, user.password)
        if ((user.email === email) && isMatch) {
          // Generate JWT Token
          const AccessToken = jwt.sign({ userID: user._id ,email:user.email,  role:"admin" }, process.env.JWT_ACCESS_SECRET_KEY, { expiresIn: '1d' })
    
          res.cookie("adminToken", AccessToken, {
    
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

const getAdmin = async(req, res) => {
  try {
      const adminToken = req.cookies.adminToken;
      if(!adminToken) return res.status(401).json({ "status": "failed", "message": "Unauthorized User, No Token" });
          // console.log(refreshToken);
    const {userID,email} =jwt.verify(adminToken,process.env.JWT_ACCESS_SECRET_KEY);
    let user= await Admin.findOne({_id:userID}).select('-password')      
    if(!user) return res.status(401).json({ "status": "failed", "message": "Wrong token" });

          
          res.status(200).json({"status": "success", "message": "authorized user", userID,email });
      }
  
  catch (error) {
      console.log(error);
      res.status(401).json({ "status": "failed", "message": "Something went wrong" });
  }
}

const adminLogout = async (req, res) => {
  try{
  const adminToken = req.cookies.adminToken;
  if (!adminToken) {return res.status(400).json({ "status": "failed", "message": "Unable to Logout" });}
  else{res.clearCookie("adminToken");
      
  return res.status(200).json({ "status": "success", "message": "Successfully Logout" });
  }  
}
catch(error){
  return res.status(400).json({ "status": "failed", "message": "Unable to Logout" });}
}



const bookPost= async(req,res)=>{
    try{
      const {name,author,edition,book_id,number_of_books,tag_of_book,semester}=req.body;
        let book = await Book.findOne({name:name,author:author,edition:edition});
           console.log(book);
        const book_id_array=book_id.split(',');
        if (book){
         return res.status(400).json({
            status: "failed",
            message: "Already exist this book in database",
          });
        }
        
          else if(book_id_array.length!=Number(number_of_books)){

            console.log(book_id_array.length,number_of_books);
            return res.status(400).json({
              status: "failed",
              message: "Number of books and number of id should be same",
            });
          } 

        else{
          console.log(req.files);

           
            
            const auth = authenticateGoogle();
            const data1 = await uploadToGoogleDrive(req.files.book_cover[0], auth);
          const data2 = await uploadToGoogleDrive(req.files.book_pdf[0], auth);
          console.log(data1, data2);
         
            book = await new Book({
              name,author,edition,
              book_id:book_id.split(','),
              total_book_id:book_id.split(','),
              number_of_books,
              number_of_books_available:number_of_books,
              tag_of_book: tag_of_book.split(','),
              semester:semester.split(','),
              cover_image_id:data1.id,
              pdf_id:data2.id
            }).save();
            if(book){
            deleteFile(req.files.book_cover[0].path);
            deleteFile(req.files.book_pdf[0].path);
            }
            res.status(200).json({
              status: "success",
              message: "Book uploaded"
            });
      

        }
        
         
          
    }
    catch(error){
        console.log(error);
        deleteFile(req.files.book_cover[0].path);
       deleteFile(req.files.book_pdf[0].path);
        res.status(400).json({status:'failed',message:'Unable to upload book.'})
    }
}


const responseIssueRequest=async(req,res)=>{
let issueRequest = await IssueRequest.findOne({_id:req.body.requestID}).populate('bookID');
if(!issueRequest){
  return res.status(400).json({status:'failed',message:'No issue Request is found.'});

}
else if((req.body.accept===false)&& issueRequest){
  try{

    let notification= await new Notification({receiverID:issueRequest.userID,senderID:'Admin',
    message:`Your request for issue the book named "${issueRequest.bookID.name}" has been rejected.`
    }).save();
    await Student.findOneAndUpdate(
      { _id: issueRequest.userID},
      { $push: { notification: notification._id  } },
      { new: true }
    )
    let book = await Book.findOne({_id:issueRequest.bookID._id});
    
    let avaiableBooks= book.number_of_books_available+1;
    let bookIds= book.book_id;
    bookIds.push(issueRequest.book_recognized_id);
    book = await Book.findByIdAndUpdate(book._id, { $set: { number_of_books_available: avaiableBooks, book_id:bookIds} })
    await Student.findOneAndUpdate(
      { _id: issueRequest.userID},
      { $pull: { issuedBooks: issueRequest._id  } },
      { new: true }
    )
    await IssueRequest.deleteOne({_id:req.body.requestID});
    return res.status(200).json({status:'success',message:'Request has been successfully rejected.'});
  
  }
  catch(error){
    return res.status(400).json({status:'Failed',message:'Error occur in rejection of request.'});

  }

}
else if ((req.body.accept===true )&& issueRequest){
  try{
 let notification= await new Notification({receiverID:issueRequest.userID,senderID:'Admin',
  message:`Your request for issue the book named "${issueRequest.bookID.name}" has been accepted. Now you can collect your book library within 2 working days.`
  }).save();
  await Student.findOneAndUpdate(
      { _id: issueRequest.userID},
      { $push: { notification: notification._id  } },
      { new: true }
    )
  issueRequest= await IssueRequest.findByIdAndUpdate(req.body.requestID, { $set: {expiration_date:moment().add(15, 'days').format(`DD-MM-YYYY`).toString(),request_accepted:true } })
  return res.status(200).json({status:'success',message:'Request has been successfully accepted.'});

  }
  catch(error){
    return res.status(400).json({status:'Failed',message:'Error occur in accept of request.'});

  }

}

else{
  return res.status(400).json({status:'Failed',message:'Something went wrong in backend.'});


}


}



const returnBook=async(req,res)=>{
  let issueRequest = await IssueRequest.findOne({_id:req.body.requestID,request_accepted:true}).populate('bookID');
  if(!issueRequest){
    return res.status(400).json({status:'failed',message:'No issue Request is found.'});
    
  }
  else {
    try{
  
      
      let book = await Book.findOne({_id:issueRequest.bookID._id});
      
      let avaiableBooks= book.number_of_books_available+1;
      let bookIds= book.book_id;
      bookIds.push(issueRequest.book_recognized_id);
      book = await Book.findByIdAndUpdate(book._id, { $set: { number_of_books_available: avaiableBooks, book_id:bookIds} })
      let user= await  Student.findOne({_id:issueRequest.userID});
      await Student.findOneAndUpdate(
        { _id: user._id,},
        { $pull: { issuedBooks: issueRequest._id  } },
        { new: true }
      )
      console.log(req.body.fine)

      await IssueRequest.deleteOne({_id:req.body.requestID});
      if(req.body.fine&&(req.body.fine>0)){
      const fine=  parseInt(req.body.fine) + parseInt(req.body.fine);
      user =await Student.findByIdAndUpdate({_id:user._id},{ $set: { fine:fine} })
    
      }
      

      let notification= await new Notification({receiverID:issueRequest.userID,senderID:'Admin',
      message:`You returned "${issueRequest.bookID.name}".`
      }).save();
      await Student.findOneAndUpdate(
        { _id: user._id,},
        { $push: { notification: notification._id  } },
        { new: true }
      )
      return res.status(200).json({status:'success',message:`${user.fname} returned book.`});
    

    }
    catch(error){
      return res.status(400).json({status:'Failed',message:'Error occur in request.'});
  
    }
  
  }

  }

  const responseReIssueRequest=async(req,res)=>{
    let reIssueRequest= await ReIssueRequest.findOne({_id:req.body.requestID});
    if(!reIssueRequest){
      return res.status(400).json({status:'failed',message:'No Re-issue Request is found.'});
    
    }
    let issueRequest = await IssueRequest.findOne({_id:reIssueRequest.issueID}).populate('bookID');
    if(!issueRequest){
      return res.status(400).json({status:'failed',message:'No details is found.'});
    
    }
     
      try{
        if(req.body.accept){
         let notification = await new Notification({receiverID:issueRequest.userID, senderID:'Admin',
        message:`Your request for Re-issue the book named "${issueRequest.bookID.name}" has been accepted.`
        }).save();
        await Student.findOneAndUpdate(
          { _id: issueRequest.userID,},
          { $push: { notification: notification._id  } },
          { new: true }
        )
          issueRequest= await IssueRequest.findByIdAndUpdate(issueRequest._id, { $set: {expiration_date:moment(issueRequest.expiration_date, "DD-MM-YYYY").add(15, 'days').format(`DD-MM-YYYY`).toString()} });
          reIssueRequest= await ReIssueRequest.deleteOne({_id:req.body.requestID});
            return res.status(200).json({status:'success',message:'Request has been successfully accepted.'});
        }
        else{
          let notification = await new Notification({receiverID:issueRequest.userID, senderID:'Admin', message:`Your request for Re-issue the book named "${issueRequest.bookID.name}" has been rejected.`
          }).save();
          await Student.findOneAndUpdate(
            { _id: issueRequest.userID,},
            { $push: { notification: notification._id  } },
            { new: true }
          )
          reIssueRequest= await ReIssueRequest.deleteOne({_id:req.body.requestID});
          return res.status(200).json({status:'success',message:'Request has been successfully rejected.'});

        }

      
      }
      catch(error){
        return res.status(400).json({status:'Failed',message:'Error occur in rejection of request.'});
    
      }
  
    
    }

 const findAllIssueRequest=async(req,res)=>{
  const issueReq= await IssueRequest.find({request_accepted:false}).sort({createdAt:1}).populate('userID','fname lname roll series dept issuedBooks');
  res.status(200).json({status:'success',message:'Found all issue requests',issueReq});
 }

 const findAllReIssueRequest=async(req,res)=>{
  const reIssueReq= await ReIssueRequest.find().sort({createdAt:1}).populate({path : 'userID' , select: '_id fname lname roll series dept'}).populate({path : 'issueID' , select: '_id bookName bookAuthor bookCoverId book_recognized_id'});
  res.status(200).json({status:'success',message:'Found all Reissue requests',reIssueReq});
 }
 const findStudents=async(req,res)=>{
  if(req.body.searchTerm=='all'){
    try{
      let students= await Student.find().limit(20).populate('issuedBooks');
    return res.status(200).json({status:"success",message:"Students found",students})
    }catch(e){
     
    return res.status(400).json({status:"success",message:"Students not found"});
    }
    
  }
  if(req.body.searchTerm==''){
    return res.status(400).json({status:"failed",message:"filled your search field"})
  }

  try{
    let students= await Student.find({ roll :new RegExp(`^(${req.body.searchTerm})`, 'i') }).limit(20).populate('issuedBooks');
   if(students.length>0){
    return res.status(200).json({status:"success",message:"Students found",students})

   }
   else{
    return res.status(400).json({status:"failed",message:"students not found"})

   }
  }catch(e){
   
  return res.status(400).json({status:"success",message:"students not found"});
  }
}


const findAllIssueRequestbySearch=async(req,res)=>{
  if(req.body.searchTerm=='all'){
    try{
      let issuedBooks= await IssueRequest.find({request_accepted:true}).limit(20).populate('userID');
    return res.status(200).json({status:"success",message:"Issued books found",issuedBooks})
    }catch(e){
     
    return res.status(400).json({status:"success",message:"Issued Books not found"});
    }
    
  }
  if(req.body.searchTerm==''){
    return res.status(400).json({status:"failed",message:"filled your search field"})
  }

  try{
    let issuedBooks= await IssueRequest.find({ roll :new RegExp(`^(${req.body.searchTerm})`, 'i') ,request_accepted:true}).limit(20).populate('userID');
   if(issuedBooks.length>0){
    return res.status(200).json({status:"success",message:"Issued books found",issuedBooks})

   }
   else{
    return res.status(400).json({status:"failed",message:"Issued Books not found"})

   }
  }catch(e){
   
  return res.status(400).json({status:"success",message:"issuedBooks not found"});
  }
}

module.exports = {adminLogin,getAdmin,adminLogout,findAllIssueRequestbySearch,findStudents,bookPost,responseIssueRequest,responseReIssueRequest,returnBook,findAllIssueRequest,findAllReIssueRequest}