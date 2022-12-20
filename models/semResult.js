const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Joi = require("joi");

const semResult = new Schema({

  series:{
    type:String,
    required: true,
  },
  semester:{
    type:String,
    required: true,
  },
  dept:{
    type:String,
    required: true,
  },
  roll:{
    type:String,
    required: true,

  },
  gp: {
    type: String,
    required: true,
  },
  semesterEarnCredit: {
    type: String,
    required: true,
  },
  gpa: {
    type: String,
    required: true,
  },

  totalEarnCredit: {
    type: String,
    required: true,
  },
  cgpa: {
    type: String,
    required: true,
  },
  failedSubject:{
    type: String
    
  }
},{ timestamps: true });

const SemResult = mongoose.model("SemResult", semResult);




module.exports = SemResult;