const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Joi = require("joi");

const ctResult = new Schema({

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
  courseTitle: {
    type: String,
    required: true,
  },
  roll:{
    type:String,
    required: true,

  },
  
  CT1: {
    type: String,
    required: true,
  },
  CT2: {
    type: String,
    required: true,
  },

  CT3: {
    type: String,
    required: true,
  },
  CT4: {
    type: String,
    required: true,
  },
  attendance:{
    type: String
    
  }

},{ timestamps: true });

const CtResult = mongoose.model("CtResult", ctResult);




module.exports = CtResult;