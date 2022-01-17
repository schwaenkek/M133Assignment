const express               =  require('express'),
      app                   =  express(),
      mongoose              =  require("mongoose"),
      passport              =  require("passport"),
      bodyParser            =  require("body-parser"),
      LocalStrategy         =  require("passport-local"),
      passportLocalMongoose =  require("passport-local-mongoose"),
      User                  =  require("./models/user");
      EntryModel              =  require("./models/entries");

require('dotenv/config');

var fs = require('fs');
var path = require('path');

//Connecting database
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
	console.log('connected to ' + process.env.MONGO_URL)
    mongoose.use
});

app.use(require("express-session")({
    secret:"password",       //decode or encode session
    resave: false,          
    saveUninitialized:false    
}));

passport.serializeUser(User.serializeUser());       //session encoding
passport.deserializeUser(User.deserializeUser());   //session decoding
passport.use(new LocalStrategy(User.authenticate()));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded(
      { extended:true }
))

//app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(passport.initialize());
app.use(passport.session());



// Filestorage via Multer
var multer = require('multer');

var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads')
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now())
	}
});

var upload = multer({ storage: storage });

//=======================
//      R O U T E S
//=======================
app.get("/", (req,res) =>{
    res.render("login");
})
//app.get("/", (req,res) =>{
//res.render("fuckoff");
//})

app.get("/home",isLoggedIn ,(req,res) => {
    res.render("home");
})

app.get('/createEntries', isLoggedIn, (req, res) => {
	EntryModel.find({}, (err, items) => {
		if (err) {
			//console.log('storing ERROR')
			console.log(err);
			res.status(500).send('An error occurred', err);
		}
		else {

			res.render('createEntries', { items: items });
		}
	});
});

app.post('/', upload.single('Entry'), (req, res, next) => {

	var obj = {
		title: req.body.title,
		desc: req.body.desc,
		date: req.body.date,
		user: req.user.username,
	}
	EntryModel.create(obj, (err, item) => {
		if (err) {
			console.log(err);
		}
		else {
			// item.save();
			//res.redirect('/');
			res.redirect('createEntries');
		}
	});
});


app.get('/', (req, res) => {
	EntryModel.find({}, (err, items) => {
		if (err) {
    		console.log(err);
			res.status(500).send('An error occurred', err);
		}
		else {
			res.render('createEntries', { items: items });
		}
	});
});

app.get('/showEntries', (req, res) => {
	EntryModel.find({}, (err, items) => {
		if (err) {
			console.log(err);
			res.status(500).send('An error occurred', err);
		}
		else {
			res.render('showEntries', { items: items });
		}
	});
});

//Auth Routes
//=======================
//     E L  L O G I N
//=======================
app.get("/login",(req,res)=>{
    res.render("login");
});

app.post("/login",passport.authenticate("local",{
    successRedirect:"/home",
    failureRedirect:"/login"
}),function (req, res){

});

//=======================
//L O S  R E G I S T R O S
//=======================

app.get("/register",(req,res)=>{
    res.render("register");
});

app.post("/register",(req,res)=>{
    
    User.register(new User({username: req.body.username,email:req.body.phone,phone: req.body.telephone}),req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.render("register");
        }
    passport.authenticate("local")(req,res,function(){
        res.redirect("/login");
		writeToLog("registered", req.user.username);
    })    
    })
})

//=======================
//  E L  L O G O U T
//=======================
app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
});

function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}
function writeToLog(txt, usr) {
    const timeElapsed = Date.now();
    const today = new Date(timeElapsed);
    var logtxt = `------${today.toUTCString()}-----\n User ${usr} logged ${txt} successfully.\n----------------------------------------\n\n`;

    fs.appendFileSync('logs/log.txt', logtxt);
}

app.use(express.static(__dirname));

//Listen On Server
app.listen(process.env.PORT || 8080,function (err) {
    if(err){
        console.log(err);
    }else {
        console.log("Server Started At Port " + process.env.PORT);
    }
      
});
