$(document).ready(function() {
  // AJAX to delete a genre
  $('.delete-genre').on('click', function() {
    var id = $(this).data('id')
    var url = '/genres/delete/'+id

    if(confirm('Delete Genre?')) {
      $.ajax({
        url: url,
        type: 'DELETE',
        success: function(result) {
          console.log('Deleting Genre...')
          window.location.href='/genres'
        },
        error: function(err) {
          console.log(err)
        }
      })
    }
  })

  // AJAX to delete an album
  $('.delete-album').on('click', function() {
    var id = $(this).data('id')
    var url = '/albums/delete/'+id

    if(confirm('Delete album?')) {
      $.ajax({
        url: url,
        type: 'DELETE',
        success: function(result) {
          console.log('Deleting album...')
          window.location.href='/albums'
        },
        error: function(err) {
          console.log(err)
        }
      })
    }
  })

})