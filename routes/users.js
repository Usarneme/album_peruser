var express = require('express')
var router = express.Router()

// firebase connection (w/config)
var firebase = require('../fb')

router.get('/register', function(req, res, next) {
  res.render('users/register')
})

router.post('/register', function(req, res, next) {
  console.log('\tPOSTing to users/register')

  // Get form data
  var first_name = req.body.first_name
  var last_name = req.body.last_name
  var email = req.body.email
  var password = req.body.password
  var password2 = req.body.password2
  var location = req.body.location
  var fav_artists = req.body.fav_artists
  var fav_genres = req.body.fav_genres

  // Validate form data
  req.checkBody('first_name', 'First name is required').notEmpty()
  req.checkBody('email', 'Email is required').notEmpty()
  req.checkBody('email', 'Email is not valid').isEmail()
  req.checkBody('password', 'Password is required').notEmpty()
  req.checkBody('password2', 'Passwords must match').equals(req.body.password)

  // Log errors
  var errors = req.validationErrors()
  if(errors) {
    console.log('\tValidation errors on registering new user. Error total: '+errors.length)
    errors.forEach(function(err) {
      console.log('\t'+err.msg)
    })
    console.log('\tSending first (of possible several) errors to user: '+errors[0].msg)
    req.flash('error_msg', 'Unable to create user. Error: '+errors[0].msg)
    res.redirect('register')
  } else {
    // Create the user account
    firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(function(user) {
      // console.log(Object.keys(user.user))
      console.log('\tCreated user with uid: '+user.user.uid)

      // authenticate the current user to create a user ref
      var userRef = firebase.auth().currentUser

      // build user data from the additional info from the register form
      var userData = {
        uid: user.user.uid,
        first_name : first_name,
        last_name : last_name,
        email: email,
        location : location,
        fav_artists : fav_artists,
        fav_genres : fav_genres
      }

      var userRef = firebase.database().ref('users/')

      userRef.push().set(userData).then(function() {
        // Update successful.
        req.flash('success_msg', 'You are now registered and can login')
        res.redirect('/users/login')

      }).catch(function(error) {
        // An error happened.
        console.log('\tError updating user')
      })

    }, function(error) {
        // Handle Errors
        var errorCode = error.code
        var errorMessage = error.message
        console.log('\tError creating user. Error #'+errorCode)
        console.dir(errorMessage)
        req.flash('error_msg', 'Unable to create user. Error: '+errorMessage)
        res.redirect('/users/register')
    })
  }
})

router.get('/login', function(req, res, next) {
  res.render('users/login')
})

router.post('/login', function(req, res, next) {
  console.log('\tPOSTing to users/login')

  // Get form data
  var email = req.body.email
  var password = req.body.password

  // Validate form data
  req.checkBody('email', 'Email is required').notEmpty()
  req.checkBody('email', 'Email is not valid').isEmail()
  req.checkBody('password', 'Password is required').notEmpty()

  // Log errors
  var errors = req.validationErrors()
  if(errors) {
    console.log('\tValidation errors on logging in user. Error total: '+errors.length)
    console.log('\tSending first (of possible several) errors to user: '+errors[0].msg)
    req.flash('error_msg', 'Login Failed. Error: '+errors[0].msg)
    res.redirect('login')
  } else {
    // Create the user account
    firebase.auth().signInWithEmailAndPassword(email, password)
    .then(function(user) {
      // console.log(Object.keys(user)) => [ 'user', 'credential', 'additionalUserInfo', 'operationType' ]
      // console.log(user.additionalUserInfo) => Pf { providerId: 'password', isNewUser: false }

      console.log('\tLogged in user: '+user.user.uid)
      // Update successful.
      req.flash('success_msg', 'You are now logged in!')
      res.redirect('/albums')

      }).catch(function(error) {
        // Handle Errors
        var errorCode = error.code
        var errorMessage = error.message
        console.log('\tError logging in user. Error #'+errorCode)
        console.dir(errorMessage)

        req.flash('error_msg', 'Unable to login user. Error: '+errorMessage)
        res.redirect('/users/login')
    })
  }
})

router.get('/logout', function(req, res) {
  // De auth
  firebase.auth().signOut().then(function() {
    // Sign-out successful.
    console.log("\tSign out successful.")
    req.flash('success_msg', 'You are now logged out!')
    res.redirect('/albums')
  }).catch(function(error) {
    // An error happened.
    console.log('\tError signing out user')
    req.flash('error_msg', 'Unable to login user. Error: '+error)
    res.redirect('/albums')
  })
})

module.exports = router