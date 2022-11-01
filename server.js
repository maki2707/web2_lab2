require("dotenv").config();
const express = require("express");
const {
  auth,
  requiresAuth,
  claimCheck,
  claimIncludes,
  claimEquals
} = require("express-openid-connect");
const https = require("https");
const fs = require("fs");
const app = express();
var path = require("path");
const db = require("./db");
const {
  ResultWithContext
} = require("express-validator/src/chain");
const externalUrl = process.env.RENDER_EXTERNAL_URL;
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
var cookieParser = require('cookie-parser');
const session = require('express-session')





/*********************************************************************************************************************************/

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({
  extended: true
})); 

app.use(cookieParser());

app.use(session(
    {
    secret: process.env.SECRET,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 1000 * 60 * 60 * 24,
    },
    skipSilentLogin:false
}));


var sess;

app.get('/', async function (req, res){  
    sess = req.session;
    if(sess.user)
    {
        res.render("introPage", {
            title: "Intro", 
            sess: sess,       
        }) 
    } else {
        res.redirect("/login")
    }
    
});
app.get('/login', async function (req, res){  
   console.log(req.session.user)
    res.render("loginPage", {
        title: "Prijava", 
        error: false
        })
});


app.get('/comments-safe', async function (req, res){ 
    let komentari = null;
    komentari = ( await db.query("select * FROM comments order by ctime")).rows;
    res.render("comments_safe", {
    title: "Comments",
    linkActive: "comments-safe", 
    komentari: komentari,   
    }) 
});

app.get('/comments-vuln', async function (req, res){  
    
    let komentari = null;
    komentari = ( await db.query("select * FROM comments order by ctime")).rows;
    res.render("comments_vuln", {
    title: "Comments",
    linkActive: "comments-vuln", 
    komentari: komentari,
    }) 
});

app.get('/html-vuln', async function (req, res){     
    var favnum = 55; 
    res.render("html_vuln", {
    title: "HTML-vuln",  
    favnum : favnum
    }) 
});

app.post("/", async function (req, res) {
      let datum = new Date(Date.now()).toISOString();
      let vrijeme = new Date(Date.now()).toLocaleTimeString();
      let komentarid = Date.now();
      await db.query( "INSERT INTO comments (comment_id, cdate, comment_text, ctime) VALUES ($1, $2, $3, $4) RETURNING *",
        [komentarid, datum, req.body.komtekst, vrijeme]
      );
      res.redirect(`/`);
    }
);

app.post("/login", async function (req, res) {
    const {username, password} = req.body;
    var dbuser = ( await db.query("select * FROM users WHERE username=$1",[username])).rows;
    if(dbuser.length !==0)
    {
        sess=req.session;
        sess.user=username;
        res.redirect(`/`);
    }   
  }
);

app.get('/logout', function (req, res) {
    delete req.session.user;
    console.log(req.session.user)
    res.redirect('/login');
  });


app.get(
    "/delete/:id([0-9]{1,13})", requiresAuth(), async function (req, res) {
    let id = parseInt(req.params.id);       
    await db.query(`DELETE FROM comments WHERE comment_id = $1 RETURNING *`, [id,]);
    res.redirect(`/`);
  }
  );


/****************************** E N D    O F     R  O  U  T  E  S *********************************************************************************/
app.listen(3000)