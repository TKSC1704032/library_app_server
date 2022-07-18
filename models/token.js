const { number, required } = require("joi");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const tokenSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  token: {
    type: 'String',
    required: true,
  },
  expire_at: {
    type: Date,expires:600, index: true, default: Date.now
}
});
tokenSchema.index({expire_at: 1 }, { expireAfterSeconds: 600 } );

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;