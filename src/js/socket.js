/**
 * Copyright (c) Timur Iskhakov.
 */


function group_socket(uri, file_id, id, receive_message, onopen) {
  var ws = new WebSocket(uri + file_id + '/' + id + '/');

  ws.onopen = (e) => onopen();
  ws.onerror = (e) => group_socket(uri, file_id, receive_message);
  ws.onmessage = (e) => { receive_message(e.data) };

  return ws;
}


module.exports = {
  group_socket: group_socket
};
