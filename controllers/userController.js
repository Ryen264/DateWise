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
              req.session.newUserID = user._id;
            
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
            return res.status(400).json({message: 'User already exists'});
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
          req.session.newUserID = newUserID;
        
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

        res.redirect('/signin');
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
};

const showProfile = async(req, res) => {
    console.log("hf");
    res.render("profile", {
        title: "Profile",
        hasLayout: true,
        css: "/css/profile.css",
    });
}

const getUser = async (req, res) => {
    try {
        const users = await Users.find();
        // console.log(locations[0]);
        // res.status(200).json(locations);
        return users;
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export {getUser, loginUser, signupUser, handle_submit_onboarding, showProfile};
            

