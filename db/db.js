const mongoose = require("mongoose");
require("dotenv").config();

module.exports = async function connection() {
  try {
    const connectionParams = {
     useNewUrlParser: true, useUnifiedTopology: true,
     useUnifiedTopology:true
    };
    // 'mongodb://127.0.0.1:27017/online_library'
    // process.env.MONGODB
    await mongoose.connect(process.env.MONGODB||'mongodb://127.0.0.1:27017/online_library', connectionParams);
    console.log("connected to database.");
  } catch (error) {
    console.log(error, "could not connect to database.");
  }
};