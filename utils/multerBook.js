const multer = require("multer");
const path = require("path");




const storage=multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, `${__dirname}/Pdf_files`);},
    filename:(req,file,cb)=>{
        const ext = path.extname(file.originalname); 
        const fileName=file.originalname.replace(ext,"").toLocaleLowerCase().split(" ").join("-")+"-"+Date.now();
        cb(null,fileName+ext);
    }
})
// Multer config
module.exports = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
     
    if (file.fieldname=='avatar'||file.fieldname=='book_cover'){
    if (file.mimetype==="image/jpg" || file.mimetype==="image/jpeg" || file.mimetype==="image/png") {
        cb(null, true);
    }
    else{
        cb(new Error("Only jpg, png or jpeg format is allowed"), false);
    }
    
  }
  
  else if (file.fieldname=='book_pdf'){
    if (file.mimetype==="application/pdf") {
        cb(null, true);
    }
    else{
        cb(new Error("Only pdf format is allowed"), false);
    }
}
else {
    cb(new Error("unable to upload"), false);
}

}
});