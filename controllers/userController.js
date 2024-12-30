import {Users} from '../models/userAccount.js';
import bcrypt from 'bcrypt';

const loginUser = async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await Users.findOne({USER_EMAIL: email});
        if (user) {
            const isMatch = await bcrypt.compare(password, user.USER_PASSWORD);
            if (isMatch) {
              req.session.user = user;
              res.status(200).json(user);
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
    const {fullname, dateofbirth, email, password, terms} = req.body;
    try {
        const existingUser = await Users.findOne({USER_EMAIL: email});
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
            USER_FNAME: fullname,
            USER_EMAIL: email,
            USER_PASSWORD: password,
            USER_DOB: dateofbirth,
            USER_DISTRICT: '', 
            USER_CUISINES: [],
            USER_MCOURSES: [], 
            USER_DESSERTS: [], 
            USER_ACTIVITIES: [] 
          });
      
          await newUser.save();
          req.session.user = newUser;
          res.status(201).json(newUser);//redirect('/onboarding_1');
    } catch (err) {
        console.log("failed signup");
        res.status(500).json({ error: err.message });
    }
};

const handle_submit_onboarding = async(req, res) => {
    // Extract data from the request body
    const { mainCourse, dessert, cuisine, activity, locations } = req.body;

    if (req.session.user) {
        // Access user information from session
        const user = req.session.user;
        
        sessionUser = await Users.findOne({USER_EMAIL: user.USER_EMAIL});
        if (sessionUser !== null && sessionUser) {
        // Process onboarding data and update user information
            if (mainCourse!=null && mainCourse)
                sessionUser.USER_MCOURSES = mainCourse;
            if (dessert!=null && dessert)
                sessionUser.USER_DESSERTS = dessert;
            if (cuisine !=null && cuisine)
                sessionUser.USER_CUISINES = cuisine;
            if (activity!=null && activity)
                sessionUser.USER_ACTIVITIES = activity;
            if (locations !=null && locations)
            sessionUser.USER_DISTRICTS = locations;
            req.session.user = sessionUser;
            try {
                await sessionUser.save(); // Save updated user information to the database
                res.status(200).json({sessionUser});//, message: 'Onboarding data submitted successfully' });
            } catch (err) {
                console.error('Error saving user data:', err);
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    } else {
        res.status(401).json({ message: 'User not authenticated' });
    }
   
};

export {loginUser, signupUser, handle_submit_onboarding};