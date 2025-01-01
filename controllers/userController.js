import {Users} from '../models/userModel.js';
import bcrypt from 'bcrypt';


const loginUser = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await Users.findOne({email: email});
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
              req.session.user = req.body.email;
              res.status(200).json({fullname: req.session.user.fullname, email:req.session.user.email});
            } else {
              res.status(401).json({ message: 'Invalid email or password' });
            }
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.log("failed login");
        res.status(500).json({ error: err.message });
    }
};

const signupUser = async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const fullname = req.body.fullname;
    const dateOfBirth = req.body.dateOfBirth;
    console.log(req.body);
    try {
        const existingUser = await Users.findOne({email: email});
        if (existingUser) {
            return res.status(400).json({message: 'This email address is already in use with another account.'});
        } 

        const lastuser = await Users.findOne().sort({ _id: -1 }).limit(1);
        let newUserID = 1;
        if (lastuser)
            newUserID = parseInt(lastuser._id.slice(-3), 10)  + 1;

         // Chuyển đổi newUserID thành chuỗi và thêm tiền tố "USR-"
         newUserID = "USR-" + newUserID.toString().padStart(3, '0');
         const newUser = new Users({
            _id: newUserID,
            fullname: fullname,
            email: email,
            password: password,
            dateOfBirth: dateOfBirth,
            districts: [], 
            cuisines: [],
            mainCourses: [], 
            desserts: [], 
            activities: [],
            favoriteLocations: [],
            plans: []
          });
          console.log(newUser);
          await newUser.save();
          
          req.session.user = email;
          res.status(201).json({fullname: req.session.user.fullname, email:req.session.user.email});//redirect('/onboarding_1');
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    }
};

const handle_submit_onboarding = async(req, res) => {
    console.log("hihi");
    console.log(req.body);
    const mainCourses = req.body.mainCourses;
    const desserts = req.body.desserts;
    const cuisines = req.body.cuisines;
    const activities = req.body.activities;
    const districts = req.body.districts;
    if (req.session.user) {
        // Access user information from session
        const email = req.session.user;
        let sessionUser = await Users.findOne({email: email});
        if (sessionUser !== null && sessionUser) {
        // Process onboarding data and update user information
            if (mainCourses!=null && mainCourses)
                sessionUser.mainCourses = mainCourses;
            if (desserts!=null && desserts)
                sessionUser.desserts = desserts;
            if (cuisines !=null && cuisines)
                sessionUser.cuisines = cuisines;
            if (activities!=null && activities)
                sessionUser.activities = activities;
            if (districts !=null && districts)
                sessionUser.districts = districts;
            try {
                await sessionUser.save(); // Save updated user information to the database
                res.status(200).json({message: "add preferences successfully"});//, message: 'Onboarding data submitted successfully' });

            } catch (err) {
                console.error('Error saving user data:', err);
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
};

const handle_edit_profile = async(req, res) => {
    console.log(req.body);
    const fullname = req.body.fullname;
    const dateOfBirth = req.body.dateOfBirth;
    let districts = req.body.districts;
    if (!districts)
        districts = [];
    const email = req.session.user;
    try {
        let user = await Users.findOneAndUpdate(
            { email: email },
            { fullname: fullname, dateOfBirth: dateOfBirth, districts: districts },
            { new: true } 
        );
        if (user) {
            res.status(200).json({ message: 'Profile updated successfully', user: email});
        } else {
            res.status(404).json({ message: 'Some errors occured' });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).json({ error: err.message });
    }
}

const handle_change_password = async(req, res) => {
    console.log(req.body);
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;
    const confirmNewPassword = req.body.confirmNewPassword;
    if (currentPassword) {
        let user = await Users.findOne({email: req.session.user});
        if (user) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (isMatch) {
                if (confirmNewPassword == newPassword){
                    if (newPassword != currentPassword) {
                        if (newPassword.length >= 8){
                            user.password = newPassword;
                            await user.save();
                            res.status(200).json({message: 'Password updated successfully.'});
                        }
                        else{
                            res.status(401).json({ message: 'The new password must contain at least 8 characters.'});
                        }
                    }
                    else {
                        res.status(401).json({ message: 'The new password cannot be the same as the current password.'});
                    }
                }
                else {
                    res.status(401).json({ message: 'The confirm password does not match the new password.'});
                }
            } else {
                res.status(401).json({message: 'Password provided is incorrect.'});
            }
        } else {
            res.status(401).json({ message: 'Error fetching user'});
        }
    }
    else err.status(401).json({message: 'Password provided is incorrect.'});
}
export {loginUser, signupUser, handle_submit_onboarding, handle_edit_profile, handle_change_password};
            

