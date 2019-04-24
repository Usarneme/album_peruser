var express = require('express')
var path = require('path')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
var session = require('express-session')
var expressValidator = require('express-validator')
var flash = require('connect-flash')

var firebase = require('./fb')
// console.log(firebase.name);
// console.log(firebase.database());

// Routes
var routes = require('./routes/index')
var albums = require('./routes/albums')
var genres = require('./routes/genres')
var users = require('./routes/users')

// Init app
var app = express()

// View Engine = ejs
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Logger
app.use(logger('dev'))

// Body Parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

// Handle Sessions
app.use(session({
  secret: 'sekret',
  saveUninitialized: true,
  resave: true
}))

// Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
    var namespace = param.split('.'),
        root = namespace.shift(),
        formParam = root

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']'
    }

    return {
      param: formParam,
      msg: msg, 
      value: value
    }
  }
}))

// Static Folder
app.use(express.static(path.join(__dirname, 'public')))

// Connect Flash
app.use(flash())

// Global Vars
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.error_msg = req.flash('error_msg')
  // Passport creates a message called error
  res.locals.error = req.flash('error')
  // currentUser will be null if not logged in
  res.locals.authData = firebase.auth().currentUser 
  res.locals.user = []
  next()
})

// Middleware to check for Firebase auth = logged in user
app.get('*', function(req, res, next) {
  console.log('\t * Route. firebase.auth().currentUser: '+firebase.auth().currentUser)
  if (firebase.auth().currentUser !== null) {
    // logged in... set global var to not null
    var userObject = firebase.auth().currentUser
    // console.log('\tUser object is not null. UID: '+userObject.uid)
    var usersRef = firebase.database().ref('users')
    // console.log('\tusersRef: '+usersRef)

    usersRef.once('value').then(function(snapshot) {
      // console.log('\tKeys to the Snapshot.child("id"): '+Object.keys(snapshot.child(id).val()) )
      // => Keys to the Snapshot.child("id"): artist,cover,genre,info,label,title,tracks,year
      // console.log( '\tSnapshot of users: '+Object.keys(snapshot) )

      snapshot.forEach(function(aUser) {
        // console.log('forEach on: '+Object.keys(aUser.val()) ) => forEach on: email,fav_artists,fav_genres,first_name,last_name,location,uid
        var id = aUser.val().uid
        // console.log('for eaching w/ uid: '+id)
        if (userObject.uid === id) {
          // matched the user record with the currently logged in user
          res.locals.user.first_name = aUser.val().first_name
          res.locals.user.last_name = aUser.val().last_name
          // console.table(res.locals.user)
        }
      })
    })
  }
  next()
})

// Routes
app.use('/', routes)
app.use('/albums', albums)
app.use('/genres', genres)
app.use('/users', users)

// Set server port
app.set('port', (process.env.PORT || 3000))

// Run server
app.listen(app.get('port'), function() {
  console.log('Server started. Listening on port '+app.get('port'))
})

