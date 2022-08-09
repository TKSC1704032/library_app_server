const fs= require('fs');
const {google} = require("googleapis");
const authenticateGoogle = () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: `${__dirname}/credencials.json`,
    scopes: "https://www.googleapis.com/auth/drive",
  });
  return auth;
};

const auth = new google.auth.GoogleAuth({
  keyFile: `${__dirname}/credencials.json`,
  scopes: "https://www.googleapis.com/auth/drive",
});
const driveService = google.drive({ version: "v3",auth });

const uploadToGoogleDrive = async (file, auth) => {
    const fileMetadata = {
      name: file.filename,
      parents: ["1iz2c82N7bOWQFFsc_up6fUsDD3swSJzl"], // Change it according to your desired parent folder id
    };
  
    const media = {
      mimeType: file.mimetype,
      body: fs.createReadStream(file.path),
    };
  
    const driveService = google.drive({ version: "v3",auth });
  
    const { data }  = await driveService.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id,name',
    });
    return data;
  };
  const deleteFile = (filePath) => {
    fs.unlink(filePath, () => {
      console.log("file deleted");
    });
  };
  



  module.exports={authenticateGoogle,uploadToGoogleDrive,deleteFile,driveService}