/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import _ from 'lodash'
import io from 'socket.io-client'


var socket = new WebSocket(
  'ws://' +
  window.location.hostname + ':' + window.location.port +
  '/ws/editor?subscribe-broadcast&publish-broadcast&echo'
);


const Socket = React.createClass({
  getInitialState() {
    return { };
  },

  componentDidMount() {
    socket.onmessage = (msg) => {
      console.log(msg.data);
    };

    socket.onopen = () => {
      console.log('Connection opened');
    };

    socket.onclose = (event) => {
      if (event.wasClean) {
        console.log('Connection closed');
      } else {
        console.log('Connection broken code: ' + event.code, ' reason: ', event.reason);
      }
    };
  },

  render() {
    return (
      <div></div>
    )
  }
});

export default Socket;
