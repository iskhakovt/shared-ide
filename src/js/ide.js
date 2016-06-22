/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'

import AceEditor from './editor-build'
import Socket from './socket-build'
import Loader from './loader-build'
import deepCompare from './compare-build'


function random_string(length)  {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}


function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}


class Editor extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      user: null,
      name: null,
      type: null,
      access: null,
      value: null,
      markers: {},
      users: null,
      theme: 'solarized_light',
      fontSize: 12,
      id: random_string(32),
      op_pull: [],
      op: null
    };
    this.modes =  {
      py2: 'python',
      py3: 'python',
      cpp: 'c_cpp'
    };

    this.cursor = {column: 0, row: 0};
    this.last_send = null;
  }

  componentDidMount() {
    this.state.user = this.props.user;
    this.load();
  }
  
  load() {
    $.get(
      this.props.file_info_url,
      {file_id: this.props.file_id}
    ).done(
      (result) => this.gotFile(result)
    ).fail(
      () => this.load()
    );
    
    $.get(
      this.props.file_context_url + this.props.file_id
    ).done(
      (result) => this.setState({value: result})
    ).fail(
      () => this.load()
    );

    $.get(
      this.props.users_info_url
    ).done(
      (result) => this.setState({users: result})
    ).fail(
      () => this.load()
    );
  }

  gotFile(files) {
    if (this.props.file_id in files) {
      this.setState({
        name: files[this.props.file_id].name,
        type: files[this.props.file_id].type,
        access: files[this.props.file_id].access
      });
      
      this.group_socket = Socket.group_socket(
        this.props.websocket_uri,
        this.props.file_id,
        this.state.id,
        (msg) => this.groupMessage(msg),
        () => this.sendCursorState()
      );
    } else {
      this.loadFile();
    }
  }

  getLoading() {
    return !this.state.name || this.state.value === null || this.state.users === null;
  }

  getType() {
    return this.modes[this.state.type];
  }

  getAbsolutePos(pos) {
    var lines = this.state.value.split('\n');
    var abs_pos = pos.column;
    for (var i = 0; i != pos.row; ++i) {
      abs_pos += lines[i].length + 1;
    }
    return abs_pos;
  }

  onChange(e) {
    var full_change = e.lines.join('\n');

    var data = {
      user: this.state.user,
      action: e.action,
      start: e.start,
      end: e.end,
      change: full_change,
      id: this.state.id
    };

    if (e.action == 'insert') {
      this.setState({
        value: this.insert(this.state.value, full_change, e.start)
      });
    } else if (e.action == 'remove') {
      this.setState({
        value: this.remove(this.state.value, e.start, e.end)
      });
    }

    this.group_socket.send(JSON.stringify(data));
  };

  insert(old, value, start) {
    var lines = old.split('\n');

    lines[start.row] = lines[start.row].slice(0, start.column) + value + lines[start.row].slice(start.column);
    return lines.join('\n');
  }

  remove(old, start, end) {
    var lines = old.split('\n');

    if (start.row == end.row) {
      lines[start.row] = lines[start.row].slice(0, start.column) + lines[start.row].slice(end.column);
    } else {
      lines[start.row] = lines[start.row].slice(0, start.column) + lines[end.row].slice(end.column);
      lines = lines.slice(0, start.row + 1).concat(lines.slice(end.row + 1));
    }

    return lines.join('\n');
  }

  onCursorChange(cursor) {
    if (!deepCompare(cursor, this.cursor)) {
      this.cursor = clone(cursor);
      this.sendCursorState();
    }
  }

  sendCursorState() {
    if (this.last_send &&
        this.last_send.action == 'cursor' &&
        deepCompare(this.last_send.end, this.cursor)) {
      return;
    }

    var data = {
      user: this.state.user,
      id: this.state.id,
      action: 'cursor',
      end: this.cursor
    };

    this.last_send = data;

    if (this.group_socket.readyState == WebSocket.OPEN) {
      this.group_socket.send(JSON.stringify(data));
    }
  }

  comparePos(pos1, pos2) {
    if (pos1.row == pos2.row) {
      return pos1.col < pos2.col;
    }
    return pos1.row < pos2.row;
  }

  countNewLine(str) {
    var res = 0;
    for (var i = str.length - 1; i >= 0; --i) {
      if (str[i] == '\n') {
        ++res;
      }
    }
    return res;
  }

  lastNewLine(str) {
    for (var i = str.length - 1; i >= 0; --i) {
      if (str[i] == '\n') {
        return i;
      }
    }
    return -1;
  }

  applyDiff(data) {
    var row = this.cursor.row, column = this.cursor.column, updatedValue;

    if (data.action == 'insert') {
      updatedValue = this.insert(this.state.value, data.change, data.start);

      if (this.comparePos(data.start, this.cursor)) {
        if (this.cursor.row == data.end.row) {
          var pos = this.lastNewLine(data.change);
          if (pos == -1) {
            column += data.change.length;
          } else {
            column += data.change.length - pos;
          }
        }
        row += this.countNewLine(data.change);
      }
    } else if (data.action == 'remove') {
      updatedValue = this.remove(this.state.value, data.start, data.end);

      if (!this.comparePos(this.cursor, data.start)) {
        if (this.comparePos(this.cursor, data.end)) {
          row = data.start.row;
          column = data.start.column;
        } else {
          if (this.cursor.row == data.end.row) {
            column += data.start.column - data.end.column;
          }
          row -= this.countNewLine(data.change);
        }
      }
    } else {
      return;
    }

    this.setState({
      value: updatedValue,
      cursor: {row: row, column: column}
    });
  }

  applyMarkers(data) {
    var markers = this.state.markers;
    if (data.action != 'disconnect') {
      markers[data.id] = {
        username: this.state.users[data.user].username,
        pos: data.end
      };
    } else {
      delete markers[data.id];
    }
    this.setState({
      markers: markers
    });
  }

  tryApply(from_op) {
    if (!this.state.op_pull.length || (!from_op && this.state.op)) {
      if (from_op) {
        this.setState({
          op: null
        });
      }
      return;
    }

    this.setState({
      op: this.state.op_pull[0],
      op_pull: this.state.op_pull.slice(1)
    });

    if (this.state.op.action == 'insert' || this.state.op.action == 'remove') {
      this.applyDiff(this.state.op);
    }
    this.applyMarkers(this.state.op);

    this.tryApply(true);
  }

  groupMessage(data) {
    var parsed = JSON.parse(data);

    if (!('action' in parsed) || parsed.id == this.state.id) {
      return;
    }

    this.setState({
      op_pull: this.state.op_pull.concat([parsed])
    });
    this.tryApply(false);
  }
  
  render() {
    return (
      <Loader loading={this.getLoading()}>
        <AceEditor
          mode={this.getType()}
          theme={this.state.theme}
          fontSize={this.state.fontSize}
          value={this.state.value}
          name="editor"
          showGutter={true}
          showLineNumbers={true}
          onChange={(e) => this.onChange(e)}
          cursor={this.cursor}
          onCursorChange={(cursor) => this.onCursorChange(cursor)}
          readOnly={this.state.access != 'edit'}
          highlightActiveLine={true}
          markers={this.state.markers}
        />
      </Loader>
    );
  };
}


ReactDOM.render(
  <Editor
    user={$('#user').val()}
    file_id={$('#file_id').val()}
    file_info_url="/disk/files/"
    users_info_url="/disk/users/"
    file_context_url="/ide/file_context/"
    websocket_uri={$('#websocket_uri').val()}
  />,
  document.getElementById('root')
);
