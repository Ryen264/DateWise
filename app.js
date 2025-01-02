import express from 'express';
import expressHbs from 'express-handlebars';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import connectDB from './config/db.js';
import {loginUser, signupUser, handle_submit_onboarding, handle_edit_profile, handle_change_password} from './controllers/userController.js';
import {getLocations} from './controllers/locationController.js'; //merge with branch quynh-huong-2106
import {createPlan, getTags, generatePlan} from './controllers/planController.js'; //
import {Users} from './models/userModel.js';
dotenv.config();
connectDB();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Khởi tạo ứng dụng Express
const app = express();

// Định nghĩa port
const port = 3000;

const secretKey = process.env.SESSION_SECRET;

// session middleware
app.use(session({
  secret: secretKey,   
  resave: false,
  saveUninitialized: true,
  cookie: {secure: false}
}));

// Middleware to parse JSON bodies and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname + "/public"));

app.engine(
    'hbs', 
    expressHbs.engine({
        layoutsDir: __dirname + "/views/layouts",
        partialsDir: __dirname + "/views/partials",
        extname: "hbs",
        defaultLayout: "layout",
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
        },
        helpers: {
            formatDateToMMDDYY: (date) => {
              const options = {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit"
              };
              return new Intl.DateTimeFormat("en-US", options).format(date);
            },

            formatDateToISO: (date) => {
              const d = new Date(date);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            },
            formatDateInNumeric: (date) => {
                const d = new Date(date);
                if (isNaN(d)) {
                    return '';
                }
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${month}/${day}/${year}`;
            },
            formatDate: (date) => {
                return new Date(date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                });
            },
            eq: (a, b) => a === b,
            json: (obj) => {
                if (obj === undefined || obj === null) {
                    return ""; 
                }
                try {
                    const jsonString = JSON.stringify(obj);
                    return jsonString
                        .replace(/</g, "\\u003c") 
                        .replace(/>/g, "\\u003e")
                        .replace(/&/g, "\\u0026")
                        .replace(/'/g, "\\u0027")
                        .replace(/"/g, "\\u0022");
                } catch (error) {
                    console.error("Error in JSON helper:", error, "Data:", obj);
                    return "";
                }
            },
            ifEquals: (arg1, arg2, options) => {
                return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
            },
            getDomain: (email) => {
                if (!email || typeof email !== 'string') {
                    return ''; 
                }
                const domain = email.split('@')[0]; 
                return domain ? `@${domain}` : ''; 
            }
        }
    })
);

app.set("view engine", "hbs");

// Định nghĩa route cho đường dẫn gốc ("/")
app.get('/signin', (req, res) => {
  if (req.session.user)
    res.redirect('/');
  else
    // res.sendFile(path.join(__dirname, 'views', 'Page', 'SignIn', 'signin.html'));
    res.render("signin", {
        title: "Sign In",
        hasLayout: false,
        css: "/css/signin.css",
    });
});
app.post('/signin', loginUser);

app.get('/signup', (req, res) =>  {
  if (req.session.user)
    res.redirect('/');
  else
    res.render("signup", {
        title: "Sign Up",
        hasLayout: false,
        css: "/css/signup.css",
    });
});
app.post('/signup', signupUser)

app.get('/onboarding1', (req, res) => {
    // res.sendFile(path.join(__dirname, 'views', 'Page', 'Onboarding1', 'onboarding1.html'));
    res.render("onboarding1", {
        title: "Onboarding",
        hasLayout: false,
        css: "/css/onboarding1.css",
    });
});
app.get('/onboarding2', (req, res) => {
    // res.sendFile(path.join(__dirname, 'views', 'Page', 'Onboarding2', 'onboarding2.html'));
    res.render("onboarding2", {
        title: "Onboarding",
        hasLayout: false,
        css: "/css/onboarding2.css",
    });
});

app.get("/homepage", async (req, res) => {
    let userLastName;
    if (req.session.user)
    {
      let userData = await Users.findOne({email: req.session.user});
      let userFullName = userData.fullname;
      userFullName = userFullName.split(' ');
      userLastName = userFullName[userFullName.length -1];
    }
    else userLastName = "Signin";
    
    res.render("homepage", {
        title: "Homepage",
        userLastName: userLastName,
        hasLayout: true,
        css: "/css/homepage.css",
    });
});

app.get("/planning", (req, res) => {
    res.render("planning", {
        title: "Planning",
        hasLayout: true,
        css: "/css/planning.css",
    });
});

app.get("/plandetails", (req, res) => {
    res.render("plandetails", {
        title: "Plan Details",
        hasLayout: true,
        css: "/css/plandetails.css",
    });
});

app.get("/profile", async (req, res) => {
   if (req.session.user){
      let userData = await Users.findOne({email: req.session.user});
      console.log(userData);
      res.render("profile", {
          title: "Profile",
          user: userData,
          hasLayout: true,
          css: "/css/profile.css",
      });
    }
    else {
      res.redirect('/signin');
    }
});

app.get("/locationdetails", (req, res) => {
    res.render("locationdetails", {
        title: "Details",
        hasLayout: true,
        css: "/css/locationdetails.css",
    });
});
app.post('/submit_onboarding', handle_submit_onboarding);
app.get('/', (req, res) => {
  res.redirect('/homepage');
});

app.get('/getCurrentUser', (req, res) => {
  console.log("hihihihi");
  if (req.session.user) {
    // let fullname = req.session.user.fullname;
    // let fullNameArr = fullname.split(' ');
    // let userLastName = fullNameArr.length ? fullNameArr[fullNameArr.length - 1] : 'Signin';
    res.status(200).json({fullname: req.session.user.fullname, email:req.session.user.email});
  } else {
    res.status(401).json({ message: 'User not authenticated' });
  }
})

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Failed to log out');
    }
    res.redirect('/');
  });
});


app.post('/editprofile', handle_edit_profile);

app.post('/changepassword', handle_change_password);

app.get('/getCurrentUserData', async(req, res) => {
  if (req.session.user) {
    const currentUserData = await Users.findOne({email: req.session.user});
    console.log(currentUserData);
    res.status(200).json(currentUserData);
  } else {
    res.status(401).json({ message: 'User not authenticated' });
  }
})
//merge with branch quynh-huong-2106

getLocations()
  .then(locations => {
    global.locationData = locations;
    // console.log('Locations loaded and stored in global variable:', global.locationData[0]);
  })
  .catch(error => {
    console.error('Error loading locations:', error);
});

app.get('/locations', async (req, res) => {
  res.json(global.locationData);
});


getTags()
  .then(tags => {
    global.tagData = tags;
    // console.log('Tags loaded and stored in global variable:', global.tagData[0]);
  })
  .catch(error => {
    console.error('Error loading tags:', error);
});


app.get('/tags', async (req, res) => {
  res.json(global.tagData);
});

// Function to load image of location's records
async function loadFetch() {
  const { default: fetch } = await import('node-fetch');

  app.get('/proxy-image', async (req, res) => {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send('Missing image URL');
    }

    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        return res.status(response.status).send(response.statusText);
      }

      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);
      res.set('Content-Type', response.headers.get('content-type'));
      res.send(buffer);
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).send('Error fetching image');
    }
  });
}

loadFetch();


app.listen(port, () => {
  console.log(`Server đang lắng nghe trên cổng ${port}`);
});