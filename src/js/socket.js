/**
 * Copyright (c) Timur Iskhakov.
 */


import $ from 'jquery'

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
  'subscribe-broadcast': null,
  'publish-broadcast': null,
  'echo': null
});

var user_args = encodeData({
  'subscribe-user': null,
  'publish-user': null,
  'echo': null
});


function group_socket(uri, heartbeat, receive_message) {
  return new WS4Redis({
    uri: uri + document + '?' + group_args,
    heartbeat_msg: heartbeat,
    receive_message: receive_message
  }, $);
}

function user_socket(uri, heartbeat, receive_message) {
  return WS4Redis({
    uri: uri + document + '?' + user_args,
    heartbeat_msg: heartbeat,
    receive_message: receive_message
  }, $);
}

module.exports = {
  group_socket: group_socket,
  user_socket: user_socket
};
