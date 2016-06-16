/**
 * Copyright (c) Timur Iskhakov.
 */


function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) ||
    [null, ''])[1].replace(/\+/g, '%20')) ||
    null;
}

window.addEventListener('load', () => {
  document.getElementById('next').value = getURLParameter('next');
  document.getElementById('change-auth').href += location.search;
});
