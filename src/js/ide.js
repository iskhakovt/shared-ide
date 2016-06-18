/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ReactDOM from 'react-dom'
import ot from 'ot'

import AceEditor from './editor-build'
import Socket from './socket-build'


class Editor extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      user: null,
      value: '',
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
      (msg) => this.groupMessage(msg)
    );
    this.state.user_socket = Socket.user_socket(
      this.props.websocket_uri,
      this.props.websocket_heartbeat,
      (msg) => this.userMessage(msg)
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
        onChange={(e) => this.onChange(e)}
        group_socket={this.state.group_socket}
        user_socket={this.state.user_socket}
      />
    );
  };

  getAbsolutePos(pos) {
    var lines = this.state.value.split('\n');
    var abs_pos = pos.column;
    for (var i = 0; i != pos.row; ++i) {
      abs_pos += lines[i].length + 1;
    }
    return abs_pos;
  }

  onChange(e) {
    this.state.group_socket.send_message(JSON.stringify({
      user: this.state.user,
      action: e.action,
      start: e.start,
      end: e.end,
      change: e.lines.join('\n')
    }));
  };

  groupMessage(data) {
    var parsed = JSON.parse(data);
    var operation;

    console.log('Group message', parsed);

    if (!('action' in parsed)) {
      return;
    }

    if (parsed.action == 'insert') {
      operation = new ot.TextOperation()
        .retain(this.getAbsolutePos(parsed.start))
        .insert(parsed.change)
        .retain(this.state.value.length - this.getAbsolutePos(parsed.start));
    } else if (parsed.action == 'remove') {
      operation = new ot.TextOperation()
        .retain(this.getAbsolutePos(parsed.start))
        .delete(parsed.change)
        .retain(this.state.value.length - this.getAbsolutePos(parsed.end));
    } else {
      return;
    }

    var updatedValue = operation.apply(this.state.value);
    this.setState({
      value: updatedValue
    });
  }

  userMessage(data) {
    var parsed = JSON.parse(data);

    console.log('User message', parsed);
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
