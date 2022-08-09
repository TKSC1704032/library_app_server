const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Joi = require("joi");

const issueRequestSchema = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  bookID: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true,

  },
  bookName:{
  type:String,
  required:true
  },
  bookAuthor:{
    type:String,
    required:true
  },
  bookCoverId:{
    type:String,
    required:true
  },
  roll:{
    type:String,
    required: true,

  },
  book_recognized_id: {
    type: String,
    required: true,
  },
  expiration_date:{
    type:String,
    default:null
    
  },
  request_accepted:{
    type:Boolean,
    default:false
  }
  
},{ timestamps: true });

const IssueRequest = mongoose.model("IssueRequest", issueRequestSchema);




module.exports = IssueRequest;