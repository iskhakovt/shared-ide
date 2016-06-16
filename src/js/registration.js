/**
 * Copyright (c) Timur Iskhakov.
 */


import $ from 'jquery'
import Cookies from 'js-cookie'


var csrftoken = Cookies.get('csrftoken');

function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
  beforeSend: function(xhr, settings) {
    if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
      xhr.setRequestHeader("X-CSRFToken", csrftoken);
    }
  }
});


function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) ||
    [null, ''])[1].replace(/\+/g, '%20')) ||
    null;
}

function signup(form) {
  $.post(
    '.',
    {
      'username': form.id_username.value,
      'first_name': form.id_first_name.value,
      'last_name': form.id_last_name.value,
      'email': form.id_email.value,
      'password': form.id_password.value
    }
  ).done(function() {
    var next = getURLParameter('next');
    if (!next) {
      next = '/disk/'
    }
    window.location.replace(next);
  }).fail(function(data, status) {
    if (data['responseText'] == 'username-exists') {
      $('#exists').show();
    } else {
      alert('Unspecified error occurred');
    }
  }).always(function() {
    document.getElementById('submit').disabled = false;
  });
}

window.addEventListener('load', () => {
  document.getElementById('change-auth').href += location.search;
  $('#exists').hide();

  $("#auth").submit(function(event) {
    event.preventDefault();
    signup(event.target);
  });
});
