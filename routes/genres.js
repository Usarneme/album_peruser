var express = require('express')
var router = express.Router()

// firebase connection (w/config)
var firebase = require('../fb')

// Middleware to check for a logged in user as all genres routes are restricted
router.get('*', function(req, res, next) {
  if (firebase.auth().currentUser == null) {
    res.redirect('/users/login')
  }
  next()
})

router.get('/', function(req, res, next) {
  var genresRef = firebase.database().ref('genres').orderByKey(),
      genresData = []

  genresRef.once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      // console.log('\tSnapshot key: '+childSnapshot.key) // => Snapshot key: -Ld74BljTkfIpWCZuOBP
      // console.log('\tSnapshot val: '+Object.entries(childSnapshot.val())) // => Snapshot data: name,Rap

      genresData.push({
        id: childSnapshot.key,
        name: childSnapshot.val().name
      })
    })
    // Render
    res.render('genres/index', { genres: genresData })  
  })
})

router.get('/add', function(req, res, next) {
  res.render('genres/add')
})

router.post('/add', function(req, res, next) {
  var genre = {
    name: req.body.name
  }
  console.log("POST - New Genre: "+genre)

  var genresRef = firebase.database().ref('genres')
  var newGenreRef = genresRef.push()

  newGenreRef.set(genre)

  req.flash('success_msg', 'Genre Saved')
  res.redirect('/genres')
})

router.get('/edit/:id', function(req, res, next) {
  var id = req.params.id
  console.log('\tGetting genres/edit/'+id)

  var genreRef = firebase.database().ref('genres/'+id)

  genreRef.once('value').then(function(snapshot) {
    // console.log('\tKeys to the Snapshot.child("id"): '+Object.keys(snapshot.child(id).val()) )
    // => Keys to the Snapshot.child("id"): artist,cover,genre,info,label,title,tracks,year
    var genre = snapshot.val()
    console.log('\tGET genres/edit/id: '+Object.entries(genre))
    res.render('genres/edit', { genre: genre, id: id })
  })
})

router.post('/edit/:id', function(req, res, next) {
  var id = req.params.id
  var name = req.body.name
  console.log('\tPOSTing to genres/edit/'+id)

  var genreRef = firebase.database().ref('genres/'+id)

  console.log('\tgenreRef.key: '+genreRef.key)
  console.log('\tkeys: '+Object.keys(genreRef))

  genreRef.update({
    name: name
  })
  res.redirect('/genres')
})

router.delete('/delete/:id', function(req, res, next) {
  var id = req.params.id
  console.log('\tDELETEing to genres/delete/'+id)

  var genreRef = firebase.database().ref('genres/'+id)
  genreRef.remove()
    .then(function() {
      req.flash('success_msg', 'Genre Removed')
      res.sendStatus(200)
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message)
    });
})

module.exports = router