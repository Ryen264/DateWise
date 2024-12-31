import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const userSchema = new mongoose.Schema({
   
    _id: { type: String, required: true},
    fullname: {type: String, required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    dateOfBirth: {type: Date, required: true},
    districts: {type: [String], default: []},
    cuisines: {type: [String], default: []},
    mainCourses: {type: [String], default: []},
    desserts: {type: [String], default: []},
    activities: {type: [String], default: []},
    favoriteLocations: {type: [String], default: []},
    plans: {type: [String], default: []}
});

// Băm mật khẩu trước khi lưu vào database
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      return next();
    }
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (err) {
      next(err);
    }
  });
  

const Users = mongoose.model('users', userSchema);
export {Users};