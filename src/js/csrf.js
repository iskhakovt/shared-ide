/**
 * Copyright (c) Timur Iskhakov.
 */


import Cookies from 'js-cookie'


function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function csrf($) {
  var csrftoken = Cookies.get('csrftoken');
  
  $.ajaxSetup({
      beforeSend: function(xhr, settings) {
          if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
              xhr.setRequestHeader("X-CSRFToken", csrftoken);
          }
      }
  });
} 


export default csrf;
