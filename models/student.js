const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Joi = require("joi");
const Token=require('./token')

const userSchema = new Schema({
  fname: {
    type: String,
    required: true,
    trim:true

  },
  lname: {
    type: String,
    required: true,
    trim:true

  },
  roll: {
    type: String,
    required: true,

  },
  series: {
    type: Number,
    required: true,
  },
  dept: {
    type: String,
    required: true,
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
  avatar: {
    type: String,
    default:''
  },
  cloudinary_id: {
    type: String,
    default:''
  },
  issuedBooks:[
    {
      type: Schema.Types.ObjectId,
      ref: 'IssueRequest',
    }
  ],
  notification:[
    {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
    }
  ],
  fine:{
    type: Number,
    default:0
  },
  verified: {
    type: Boolean,
    default: false,
  }
});

const Student = mongoose.model("Student", userSchema);

const validate = (user) => {
  const schema = Joi.object({
    fname: Joi.string().min(3).max(255).required(),
    lname: Joi.string().min(3).max(255).required(),
    email: Joi.string().email().required(),
  });
  return schema.validate(user);
};


module.exports = {
  Student,
  validate,
 
};