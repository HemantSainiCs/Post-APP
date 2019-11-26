const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const MongoClient = require('mongodb').MongoClient
const Mongo=require('mongodb')
const path = require('path');
const bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
let config = require('./config');

//let config = require('./config');
//let middleware = require('./middleware');



var db

// Remember to change YOUR_USERNAME and YOUR_PASSWORD to your username and password! 
MongoClient.connect('mongodb://localhost:27017/postApp', (err, database) => {
  if (err) return console.log(err)
  db = database.db('postApp')
  app.listen(process.env.PORT || 3000, () => {
    console.log('listening on 3000')
  })
})
	
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(express.static('public'))

app.get('/', (req, res) => {
  // db.collection('quotes').find().toArray((err, result) => {
  //   if (err) return console.log(err)
  //   res.render('index.ejs', {quotes: result})
  // })
  res.render('index.ejs',{name:"hemant"})
}) 
app.post('/login',(req,res)=>
{
let username=req.body.form_username;
let password=req.body.form_password;
console.log(username);
  db.collection('login-post').find({form_username:username},{}).toArray((err,result)=>{console.log(result)
bcrypt.compare(password,result[0].form_password, function(err, result) {
	if(result)
	{	console.log("succeess");
	let token = jwt.sign({username:username},config.secret,{expiresIn:'24H'});
	res.cookie("token",token);
	 res.render('index.ejs');
		}
	else
	res.redirect('/');
  
});

})
})




app.get('/list-post',verifyToken ,(req, res) => {
	// db.collection('post').find().toArray((err, result) => {
 //     if (err) return console.log(err)
 //     console.log(result);
 //     res.render('list-post.ejs', {posts: result})
 //   })
 res.sendFile(path.join(__dirname+'/views/list-post.html'))
 
})

app.post('/post-form',(req,res)=>{

	console.log("Called post form ");
	let user=req.body;
	bcrypt.hash(user.form_password,10,(err,hash)=>{
		user.form_password=hash;
		console.log(req.body)
		db.collection('login-post').save(user,(err,result)=>
		{
			 if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/')
		})
	})
		
	
	
})
app.get('/getData',verifyToken, (req, res) => {
	db.collection('post').find().toArray((err, result) => {
     if (err) return console.log(err)
     console.log(result);
     res.end(JSON.stringify({posts: result}))
   })
 
})

app.get('/create-post', verifyToken,(req, res) => {
  res.render('create-post.ejs')
})

 // app.listen(process.env.PORT || 3000, () => {
 //     console.log('listening on 3000')
 //   })

app.post('/addPost', verifyToken,(req, res) => {
	console.log("called add post")
	let post=req.body; 
	post.timestamp=new Date();
	post.upVotes=0;
	console.log(post);
    db.collection('post').save(post, (err, result) => {
    if (err) return console.log(err)
    console.log('saved to database')
    res.redirect('/')
  })	
}) 


app.post('/upvote',verifyToken,(req,res)=> {
console.log("called upvote");
let post=req.body;
// console.log(req);
// console.log(res);
 console.log(req.body);
 console.log(req.body.postId);
 console.log(req.body.upVotes);
var o_id = new Mongo.ObjectID(req.body.postId);
let upVotes=db.collection('post').find({_id:o_id},{  }).toArray(function(err,result){if(err) throw err ;console.log(result+"-----------");

db.collection('post')	
  .findOneAndUpdate({_id:o_id}, {
    $set: {
      upVotes:parseInt(result[0].upVotes)+1
    } 
  }, {	
    sort: {_id: -1},
    upsert: true
  }, (err, result) => {

    if (err) return res.send(err)
    	console.log("success")
    console.log(result);
    res.send(result)
  })












 return result[0].upVotes;	}) ;
//console.log(upVotes+"upvotes");


})



function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers['cookie'];
  // Check if bearer is undefined
  if(typeof bearerHeader !== 'undefined') {
    // Split at the space
    const bearer = bearerHeader.split('=');
    // Get token from array
    const token = bearer[1];
    // Set the token
  //  req.token = bearerToken;
    // Next middleware
    console.log(token+"---------token");
    if (token) {
    jwt.verify(token, config.secret, (err, decoded) => {
      if (err) {
        return res.json({
          success: false,
          message: 'Token is not valid'
        });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.json({
      success: false,
      message: 'Auth token is not supplied'
    });
  }
  } else {
    // Forbidden
    res.sendStatus(403);
  }

}

// app.put('/quotes', (req, res) => {
//   db.collection('quotes')
//   .findOneAndUpdate({name: 'Yoda'}, {
//     $set: {
//       name: req.body.name,
//       quote: req.body.quote
//     }
//   }, {
//     sort: {_id: -1},
//     upsert: true
//   }, (err, result) => {
//     if (err) return res.send(err)
//     res.send(result)
//   })
// })

// app.delete('/quotes', (req, res) => {
//   db.collection('quotes').findOneAndDelete({name: req.body.name}, (err, result) => {
//     if (err) return res.send(500, err)
//     res.send('A darth vadar quote got deleted')
//   })
// })
