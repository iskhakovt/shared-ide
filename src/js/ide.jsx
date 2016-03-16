/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'

import AceEditor from './editor-build'
import Socket from './socket-build'


class Editor extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      user: null,
      value: 'function f() {\n    console.log(\'hello world\');\n}',
      theme: 'solarized_light',
      fontSize: 12,
      group_socket: null,
      user_socket: null
    };
  }

  componentDidMount() {
    this.state.user = this.props.user;

    this.state.group_socket = Socket.group_socket(
      this.props.websocket_uri,
      this.props.websocket_heartbeat,
      this.groupMessage
    );
    this.state.user_socket = Socket.user_socket(
      this.props.websocket_uri,
      this.props.websocket_heartbeat,
      this.userMessage
    );
  }

  handleChange(e) {
    this.setState({
      value: e.target.value
    });
    console.log(e.target);
  }

  render() {
    return (
      <AceEditor
        mode="javascript"
        theme={this.state.theme}
        fontSize={this.state.fontSize}
        value={this.state.value}
        name="editor"
        onChange={(pos, change, value) => this.onChange(pos, change, value)}
        group_socket={this.state.group_socket}
        group_socket={this.state.user_socket}
      />
    );
  };

  onChange(pos, change, value) {
    this.setState({value: value});

    this.state.group_socket.send_message(JSON.stringify({
      user: this.state.user,
      pos: pos,
      value: change.join('\n')
    }));
  };

  groupMessage(data) {
    console.log('Group message ' + data);
  }

  userMessage(data) {
    console.log('User message ' + data);
  }
}


ReactDOM.render(
  <Editor
    user={document.getElementById('user').value}
    websocket_uri={document.getElementById('websocket_uri').value}
    websocket_heartbeat={document.getElementById('websocket_heartbeat').value}
  />,
  document.getElementById('root')
);
