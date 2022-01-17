const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");


//creating the UserModel, in which the users are created
const UserSchema = new mongoose.Schema({
    username:String,
    password:String,
    phone:Number,
    Email:String,
    IsAdmin:Boolean,
}) ;
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User",UserSchema);