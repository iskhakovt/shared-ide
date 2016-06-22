/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'

import AceEditor from './editor-build'
import Socket from './socket-build'
import Loader from './loader-build'


function random_string(length)  {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < length; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
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
      cursor: {column: 0, row: 0},
      id: random_string(32)
    };
    this.modes =  {
      py2: 'python',
      py3: 'python',
      cpp: 'c_cpp'
    };
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
    this.setState({
      cursor: cursor
    });

    this.sendCursorState();
  }

  sendCursorState() {
    var data = {
      user: this.state.user,
      id: this.state.id,
      action: 'cursor',
      end: this.state.cursor
    };

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
    var row = this.state.cursor.row, column = this.state.cursor.column, updatedValue;

    if (data.action == 'insert') {
      updatedValue = this.insert(this.state.value, data.change, data.start);

      if (this.comparePos(data.start, this.state.cursor)) {
        if (this.state.cursor.row == data.end.row) {
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

      if (!this.comparePos(this.state.cursor, data.start)) {
        if (this.comparePos(this.state.cursor, data.end)) {
          row = data.start.row;
          column = data.start.column;
        } else {
          if (this.state.cursor.row == data.end.row) {
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

  groupMessage(data) {
    var parsed = JSON.parse(data);

    if (!('action' in parsed) || parsed.id == this.state.id) {
      return;
    }

    if (parsed.action == 'insert' || parsed.action == 'remove') {
      this.applyDiff(parsed);
    }

    var markers = this.state.markers;
    if (parsed.action != 'disconnect') {
      markers[parsed.id] = {
        username: this.state.users[parsed.user].username,
        pos: parsed.end
      };
    } else {
      delete markers[parsed.id];
    }
    this.setState({
      markers: markers
    });
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
          onChange={(e) => this.onChange(e)}
          cursor={this.state.cursor}
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
