const express = require("express");
const admin = express.Router();
const {authenticateGoogle,uploadToGoogleDrive,deleteFile} = require('../utils/googleDriveApi');
const bookUpload = require('../utils/multerBook')
const cloudinary = require("../utils/cloudinary");
const upload =  require("../utils/multer")
const {adminLogin,getAdmin,adminLogout,findAllIssueRequestbySearch,bookPost,findStudents,responseIssueRequest,responseReIssueRequest,returnBook,findAllIssueRequest,findAllReIssueRequest} =require('../contolllers/adminController')

admin.post('/login-admin/',adminLogin);
admin.get('/getAdmin/',getAdmin);
admin.post('/adminLogout/',adminLogout);

admin.post('/upload-book/',upload.fields([{name:'book_cover',maxCount:1},{name:'book_pdf',maxCount:1}]),bookPost);
admin.post('/response-issue-request/',responseIssueRequest);
admin.post('/response-reissue-request/',responseReIssueRequest);
             
admin.post('/return-book/',returnBook);
admin.get('/find-all-issue-request/',findAllIssueRequest);
admin.get('/find-all-reissue-request/',findAllReIssueRequest);
admin.post('/find-students/',findStudents);
admin.post('/findAllIssueRequestbySearch/',findAllIssueRequestbySearch);

admin.post("/upload-file-to-google-drive/", bookUpload.single("book_pdf"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).send("No file uploaded.");
        return;
      }
      console.log(req.file);
      const auth = authenticateGoogle();
      const response = await uploadToGoogleDrive(req.file, auth);
      deleteFile(req.file.path);
      res.status(200).json({ response });
    } catch (err) {
      console.log(err);
      deleteFile(req.file.path);
      res.status(400).json({ status:'failed',message:'Unable to upload file' });
  }}
  );



  

module.exports = admin;