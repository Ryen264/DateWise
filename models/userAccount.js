import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const userSchema = new mongoose.Schema({
   
    _id: {
        type: String,
        required: true
    },
    USER_FNAME: {
        type: String,
        required: true
    },
    USER_EMAIL: {
        type: String,
        required: true,
        unique: true
    },
    USER_PASSWORD: {
        type: String,
        required: true
    },
    USER_DOB: {
        type: String,
        required: true
    },
    USER_DISTRICT: {
        type: String,
        // required: true
    },
      USER_CUISINES: {
        type: [String],
        default: []
    },
      USER_MCOURSES: {
        type: [String],
        default: []
    },
      USER_DESSERTS: {
        type: [String],
        default: []
    },
      USER_ACTIVITIES: {
        type: [String],
        default: []
    },
      USER_DISTRICTS: {
        type: [String],
        default: []
    },
      USER_FAVORITE_LOCATIONS: {
      type: [String],
      default: []
    },
      USER_PLANS: {
      type: [String],
      default: []
    }
});
//Hash the password before saving the user model
userSchema.pre('save', async function (next) {
    if (!this.isModified('USER_PASSWORD')) {
      return next();
    }
    try {
      const salt = await bcrypt.genSalt(10);
      this.USER_PASSWORD = await bcrypt.hash(this.USER_PASSWORD, salt);
      next();
    } catch (err) {
      next(err);
    }
  });
  

const Users = mongoose.model('users', userSchema);
export {Users};