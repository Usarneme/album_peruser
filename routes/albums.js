var express = require('express')
var router = express.Router()
var multer = require('multer')
var upload = multer({dest: './public/images/uploads'})

// firebase connection (w/config)
var firebase = require('../fb')

// Middleware to check for a logged in user as all albums routes are restricted
router.get('*', function(req, res, next) {
  if (firebase.auth().currentUser == null) {
    res.redirect('/users/login')
  }
  next()
})

router.get('/', function(req, res, next) {
  var albumRef = firebase.database().ref('albums'),
  albumData = []

  albumRef.once("value").then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var key = childSnapshot.key,
          childData = childSnapshot.val()

      albumData.push({
        id: key,
        artist: childData.artist,
        genre: childData.genre,
        info: childData.info,
        title: childData.title,
        label: childData.label,
        tracks: childData.tracks,
        cover: childData.cover
      })
    })
    // Render
    res.render('albums/index', { albums: albumData })  
  })
})

router.get('/add', function(req, res, next) {
  var genresRef = firebase.database().ref('genres'),
      genresData = []
  // Firebase returns a database snapshot, use the once event listener for the value to be returned via Promise
  genresRef.once("value")
  .then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      genresData.push(childSnapshot.val().name)
    })
    // Render
    console.log('getting albums/add with genres: '+genresData)
    // console.dir(genresData)
    // console.table(genresData)
    res.render('albums/add', { genres: genresData })  
  })
})

router.post('/add', upload.single('cover'), function(req, res, next) {
  // Check file for upload
  if (req.file) {
    console.log('Uploading file...')
    var cover = req.file.filename
  } else {
    console.log('No file selected for upload...')
    // if no image file is selected, use the default silhouette image
    var cover = 'noimage.jpg'
  }

  // Build the album
  var album = {
    artist: req.body.artist,
    title: req.body.title,
    genre: req.body.genre,
    info: req.body.info,
    year: req.body.year,
    label: req.body.label,
    tracks: req.body.tracks,
    cover: cover
  }

  // Create db reference
  var albumsRef = firebase.database().ref('albums')
  // Push new item to db
  albumsRef.push().set(album)

  req.flash('success_msg', 'Album saved successfully')
  res.redirect('/albums')
})

router.get('/details/:id', function(req, res) {
  var id = req.params.id
  console.log('\tGET albums/details/'+id)

  var albumRef = firebase.database().ref('albums')
  var album = []

  albumRef.once("value").then(function(snapshot) {

    console.log('\tKeys to the Snapshot.child("id"): '+Object.keys(snapshot.child(id).val()) )
    // => Keys to the Snapshot.child("id"): artist,cover,genre,info,label,title,tracks,year

    album.artist = snapshot.child(id).val().artist
    album.cover = snapshot.child(id).val().cover
    album.genre = snapshot.child(id).val().genre
    album.info = snapshot.child(id).val().info
    album.label = snapshot.child(id).val().label
    album.title = snapshot.child(id).val().title
    album.tracks = snapshot.child(id).val().tracks
    album.year = snapshot.child(id).val().year
    console.log('\tAlbum keys: '+Object.keys(album))
    console.log('\talbum values: '+Object.values(album))

    // Render
    res.render('albums/details', { album: album, id: id })  
  })
})

router.get('/edit/:id', function(req, res, next) {
  var id = req.params.id
  console.log('\tGetting albums/edit/'+id)

  // Get Genre data to pass to view
  var genresRef = firebase.database().ref('genres'),
      genresData = []
  // Firebase returns a database snapshot, use the once event listener for the value to be returned via Promise
  genresRef.once("value").then(function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      genresData.push(childSnapshot.val())
    })

    console.table(genresData)
    console.log(Object.keys(genresData))
    console.log(Object.values(genresData))

    // Get Album data to pass to view
    var albumRef = firebase.database().ref('albums/'+id)
    albumRef.once('value').then(function(albumSnapshot) {
      // console.log('\tKeys to the albumSnapshot.child("id"): '+Object.keys(albumSnapshot.child(id).val()) )
      // => Keys to the albumSnapshot.child("id"): artist,cover,genre,info,label,title,tracks,year

      // Render View
      res.render('albums/edit', { album: albumSnapshot.val(), id: id, genres: genresData })
    })
  })
})

router.post('/edit/:id', upload.single('cover'), function(req, res, next) {
  var id = req.params.id
  console.log('\tPOSTing albums/edit/'+id)

  var albumRef = firebase.database().ref('albums/'+id)
  console.log('\talbumRef.key: '+albumRef.key)
  console.log('\tkeys: '+Object.keys(albumRef))

  if(req.file) {
    // Update album w/cover
    albumRef.update({
      artist: req.body.artist,
      title: req.body.title,
      genre: req.body.genre,
      info: req.body.info,
      year: req.body.year,
      label: req.body.label,
      tracks: req.body.tracks,
      cover: req.file.filename
    })
  } else {
    // Update album but do not change cover image
    albumRef.update({
      artist: req.body.artist,
      title: req.body.title,
      genre: req.body.genre,
      info: req.body.info,
      year: req.body.year,
      label: req.body.label,
      tracks: req.body.tracks
    })
  }
  req.flash('success_msg', 'Album Updated')
  res.redirect('/albums/details/'+id)
})

router.delete('/delete/:id', function(req, res, next) {
  var id = req.params.id
  console.log('\tDELETEing at route albums/delete/'+id)

  var albumRef = firebase.database().ref('albums/'+id)
  albumRef.remove()
    .then(function() {
      req.flash('success_msg', 'Album Removed')
      res.sendStatus(200)
    })
    .catch(function(error) {
      console.log("Remove failed: " + error.message)
    });
})

module.exports = router