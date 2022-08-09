const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("joi");

const bookSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim:true
  },
  author: {
    type: String,
    required: true,
    trim:true

  },
  edition: {
    type: Number,
    required: true,
  },
  total_book_id: [{
    type: String,
    required: true,
    trim:true

  }],
  book_id: [{
    type: String,
    required: true,
    trim:true

  }],
  number_of_books: {
    type: Number,
    required: true,

  },
  number_of_books_available: {
    type: Number,
    required: true,
  }
  
  ,
  tag_of_book: [{
    type: String,
    required: true,
    trim:true,
    enum:[ "CE",
    "EEE",
    "ME",
    "CSE",
    "ETE",
    "IPE",
    "GCE",
    "URP",
    "MTE",
    "ARCH",
    "ECE",
    "CFPE","BECM","MSE"]
  }],
  semester:[{
    type: Number,
    required: true,
    enum: [1, 2,3,4,5,6,7,8]

  }],
  
  cover_image_id: {
    type: String,
    default:''
  },
  
  pdf_id: {
    type: String,
    default:''
  },
  
});

const Book = mongoose.model("Book", bookSchema);




module.exports = Book