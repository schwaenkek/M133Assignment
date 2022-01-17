//Getting all the libraries
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

//Connecting to database with the Mongourl form the environment file
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }, err => {
	console.log('connected to ' + process.env.MONGO_URL)
    mongoose.use
});

//create the express Sessions
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

app.use(bodyParser.json())
//using passport to verify the user
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
//THe standard call, which is like the entry point to the webpage
app.get("/", (req,res) =>{
    res.render("login");
})


//This is just a little page, which is kinda useless, but exists

/*	app.get("/", (req,res) =>{
	res.render("fuckoff");
	})
*/


//the homepage, in which you can go to whereever you want to
app.get("/home",isLoggedIn ,(req,res) => {
    res.render("home");
})

//This is the creatEntries get handler, which get you the create Entry page. This handler gets called most of the time(for the createEntries page)
app.get('/createEntries', isLoggedIn, (req, res) => {
	EntryModel.find({Usaname: req.body.username}, (err, items) => {
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
//This is the post method for creating an entry to the db, however it doesnt write the user into it, so a normal user isnt going to see any Data
app.post('/', upload.single('Entry'), (req, res, next) => {

	var obj = {
		title: req.body.title,
		desc: req.body.desc,
		date: req.body.date,
		Usaname: req.user.username,
	}
	EntryModel.create(obj, (err, item) => {
		if (err) {
			console.log(err);
		}
		else {
			res.redirect('createEntries');
		}
	});
});

//this is the page to show the createEntries Page, which never gets called, but is here to stay away from runtime errors
app.get('/', (req, res) => {
	EntryModel.find({Usaname: req.body.username}, (err, items) => {
		if (err) {
    		console.log(err);
			res.status(500).send('An error occurred', err);
		}
		else {
			res.render('createEntries', { items: items });
		}
	});
});
//this is the normal Show Page, which is shown to every user and only should show userspecific entriex
app.get('/showEntries', (req, res) => {
	EntryModel.find({Usaname: req.body.username}, (err, items) => {
		if (err) {
			console.log(err);
			res.status(500).send('An error occurred', err);
		}
		else {
			res.render('showEntries', { items: items });
		}
	});
});


//The Adminpage, which only will render, if your signed in account is admin
app.get('/showEntriesAdmin', (req, res) => {
	if(User.IsAdmin){

	
	EntryModel.find({}, (err, items) => {
		if (err) {
			console.log(err);
			res.status(500).send('An error occurred', err);
		}
		else {
			res.render('showEntriesAdmin', { items: items });
		}
	});
}
});

//Auth Routes
//=======================
//     E L  L O G I N
//=======================
app.get("/login",(req,res)=>{
    res.render("login");
});
//The Login Post
//Uses Passport functions to easily authenticate users and then redirects them
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

//register a new User
app.post("/register",(req,res)=>{
    //					The Username(no requirements) The Mail(needs to be valid mail) Phone(Is Number) Admin is initially false and meant to be changed in db directly
    User.register(new User({username: req.body.username,email:req.body.phone,phone: req.body.telephone, IsAdmin: false}),req.body.password,function(err,user){
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
//This Function verifies the users authentication and will throw you out of the app
function isLoggedIn(req,res,next) {
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect("/login");
}

//Writes logged in and logged out into the log
//Also Formats the text and records the Date
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
