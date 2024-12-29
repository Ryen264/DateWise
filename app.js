// Import thư viện Express
require('dotenv').config(); 
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db'); 
const {loginUser, signupUser, handle_submit_onboarding} = require('./controllers/userController'); 
connectDB();


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

// Định nghĩa middleware để phục vụ các tệp tĩnh
app.use(express.static(path.join(__dirname, 'views', 'Page', 'SignIn')));
app.use(express.static(path.join(__dirname, 'views', 'Page', 'SignUp')));
app.use(express.static(path.join(__dirname, 'views', 'Page', 'Planning')));
app.use(express.static(path.join(__dirname, 'views', 'Page', 'PlanDetails')));
app.use(express.static(path.join(__dirname, 'views', 'Page', 'Onboarding1')));
app.use(express.static(path.join(__dirname, 'views', 'Page', 'Onboarding2')));
app.use(express.static(path.join(__dirname, 'views', 'Page', 'Homepage')));
app.use(express.static(path.join(__dirname, 'public')));


// Định nghĩa route cho đường dẫn gốc ("/")
app.get('/signin', (req, res) => {
  if (req.session.user)
    res.redirect('/');
  else
    res.sendFile(path.join(__dirname, 'views', 'Page', 'SignIn', 'signin.html'));
});
app.post('/signin', loginUser);

app.get('/signup', (req, res) =>  {
  if (req.session.user)
    res.redirect('/');
  else
    res.sendFile(path.join(__dirname, 'views', 'Page', 'SignUp', 'signup.html'));
});
app.post('/signup', signupUser)

app.get('/onboarding_1', (req, res) => {
  if (req.session.user)
    res.redirect('/');
  else
    res.sendFile(path.join(__dirname, 'views', 'Page', 'Onboarding1', 'onboarding1.html'));
});
app.get('/onboarding_2', (req, res) => {
  if (req.session.user)
    res.redirect('/');
  else
    res.sendFile(path.join(__dirname, 'views', 'Page', 'Onboarding2', 'onboarding2.html'));
});

app.post('/submit_onboarding', handle_submit_onboarding);
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'Page', 'Homepage', 'homepage.html'));
});

app.get('/getCurrentUser', (req, res) => {
  if (req.session.user) {
    res.status(200).json(req.session.user);
  } else {
    res.status(401).json({ message: 'User not authenticated' });
  }
})

app.post('/setCurrentUser', (req, res) => {
  const { currentUser } = req.body;
  if (currentUser) {
    req.session.user = currentUser; // Update session with currentUser data
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(400).json({ message: 'No user data provided' });
  }
})
app.listen(port, () => {
  console.log(`Server đang lắng nghe trên cổng ${port}`);
});