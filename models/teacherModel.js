    const mongoose = require("mongoose");
    const Schema = mongoose.Schema;
    
    const teacherSchema = new Schema({
        name: {
            type: String,
            required: true,
            trim:true
          },
        designation: {
            type: String,
            required: true,
            trim:true
          },
        dept: {
            type: String,
            required: true,
            trim:true
          },  
      email: {
        type: String,
        required: true,
        trim:true
      },
      password: {
        type: String,
        required: true,
      },
      
    });
    
    const Teacher = mongoose.model("Teacher", teacherSchema);
    
    
    
    module.exports = Teacher;