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
      value: 'function f() {\n    console.log(\'hello world\');\n}',
      theme: 'solarized_light',
      fontSize: 12,
      group_socket: null,
      user_socket: null
    };
  }

  componentDidMount() {
    this.state.group_socket = Socket.group_socket(this.props.websocket_uri, this.props.websocket_heartbeat);
    this.state.user_socket = Socket.user_socket(this.props.websocket_uri, this.props.websocket_heartbeat);

    this.state.group_socket.receive_message = (msg) => {
      console.log('group ' + msg);
    };
    this.state.user_socket.receive_message = (msg) => {
      console.log('user  ' + msg);
    };
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
        onChange={(newValue) => this.setState({value: newValue})}
      />
    );
  };
}


ReactDOM.render(
  <Editor
    websocket_uri={document.getElementById('websocket_uri').value}
    websocket_heartbeat={document.getElementById('websocket_heartbeat').value}
  />,
  document.getElementById('root')
);
