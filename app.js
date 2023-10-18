import express from "express"
import bodyParser from "body-parser"
import ejs from "ejs"
import mongoose from "mongoose"
import 'dotenv/config'
import md5 from "md5"

const app = express()


const PORT = 3000

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
    extended: true
}))

mongoose.connect("mongodb://127.0.0.1:27017/userDB")

// this is for using mongoose encryption
//level 2 security
const userSchema = new mongoose.Schema({
    email: String,
    password: String
})





const User = new mongoose.model("User", userSchema)



app.get("/", function(req,res){
    res.render("home")
})

app.get("/login", function (req,res){
    res.render("login")
})

app.get("/register", function(req,res){
    res.render("register")
})


app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    })

    newUser.save().then(function(){
        console.log("new user is saved")
        res.render("secrets")
    }).catch(function(error){
        console.log(error)
    })
})


app.post("/login", function(req,res){
    const username = req.body.username
    const password = md5(req.body.password)

    User.findOne({email: username}).then(function(foundUser){
        if (foundUser){
            if(foundUser.password == password){
                res.render("secrets")
            }else{
                console.log("wrong password")
            }
        }else{
            console.log("not registered")
        }
    }).catch(function(error){
        console.log(error)
    })
})

app.listen(PORT, function(){
    console.log("server running on port 3000")
})