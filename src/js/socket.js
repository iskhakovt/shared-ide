/**
 * Copyright (c) Timur Iskhakov.
 */


var loc = location.href;
loc = loc.lastIndexOf('/') == (loc.length - 1) ? loc.substr(0,loc.length - 1) : loc;
var document = loc.substr(loc.lastIndexOf('/') + 1);


function encodeData(data) {
  return Object.keys(data).map(function(key) {
      if (!data[key]) {
        return key;
      } else {
        return [key, data[key]].map(encodeURIComponent).join("=");
      }
    }).join("&");
}


var group_args = encodeData({
  'subscribe-group': document,
  'publish-group': document,
  'echo': null
});

var user_args = encodeData({
  'subscribe-user': null,
  'publish-user': null,
  'echo': null
});


function group_socket(uri, heartbeat) {
  return new WS4Redis({
    uri: uri + 'editor?' + group_args,
    heartbeat_msg: heartbeat
  });
}

function user_socket(uri, heartbeat) {
  return WS4Redis({
    uri: uri + 'editor?' + user_args,
    heartbeat_msg: heartbeat
  });
}

module.exports = {
  group_socket: group_socket,
  user_socket: user_socket
};
