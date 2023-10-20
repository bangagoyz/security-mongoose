import express from "express"
import bodyParser from "body-parser"
import ejs from "ejs"
import mongoose from "mongoose"
import 'dotenv/config'
import session from "express-session"
import passport from "passport"
import passportLocalMongoose from "passport-local-mongoose"
import { Strategy as GoogleStrategy} from 'passport-google-oauth20'
import findOrCreate from "mongoose-findorcreate"

const app = express()


const PORT = 3000

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}))


app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://127.0.0.1:27017/userDB")

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
})

userSchema.plugin(passportLocalMongoose)
userSchema.plugin(findOrCreate)

const User = new mongoose.model("User", userSchema)

passport.use(User.createStrategy())

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://127.0.0.1:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/", function(req,res){
    res.render("home")
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));


app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function (req,res){
    res.render("login")
})

app.get("/register", function(req,res){
    res.render("register")
})

app.get("/secrets", function(req,res) {
    if(req.isAuthenticated()){
        res.render("secrets")
    }else{
        res.redirect("/login")
    }
})

app.get("/logout", function(req,res){
    req.logout(function(err){
        if (err){
            console.log(err)
        }else{
            res.redirect("/");
        }
    })
    
})

app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err){
            console.log(err)
            res.redirect("/register")
        }else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
    })
})


app.post("/login", function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })

    req.login(user, function(err){
        if (err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res, function(){
                res.redirect("/secrets")
            })
        }
    })
})



app.listen(PORT, function(){
    console.log(`running on port : ${PORT}`)
})