const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Joi = require("joi");

const reIssueRequestSchema = new Schema({
  userID: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  issueID: {
    type: Schema.Types.ObjectId,
    ref: 'IssueRequest',
    required: true,

  },
  bookID: {
    type: Schema.Types.ObjectId,
    ref: 'Book',
    required: true,

  },
  
  
},{ timestamps: true });

const ReIssueRequest = mongoose.model("ReIssueRequest", reIssueRequestSchema);




module.exports = ReIssueRequest;