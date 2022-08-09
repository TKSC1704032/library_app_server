const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const moment = require('moment');

const Joi = require("joi");

const notificationSchema = new Schema({
  receiverID: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  senderID: {
    type: String,
    required: true,

  },
  message: {
    type: String,
    required: true,
  }
  
},{ timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);




module.exports = Notification;