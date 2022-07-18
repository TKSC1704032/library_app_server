const mongoose = require("mongoose");

module.exports = async function connection() {
  try {
    const connectionParams = {
        useNewUrlParser: true,
        useUnifiedTopology: true, 
    };
    await mongoose.connect('mongodb://127.0.0.1:27017/online_library', connectionParams);
    console.log("connected to database.");
  } catch (error) {
    console.log(error, "could not connect to database.");
  }
};