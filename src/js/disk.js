/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import _ from 'lodash';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
import { Alert, Button, ButtonGroup, Label } from 'react-bootstrap'

import NewFile from './new_file-build'
import EditPermissions from './edit_permissions-build'
import csrf from './csrf-build'


csrf($);


function openingBracket() {
  return "{";
}


String.prototype.format = function(placeholders) {
    var s = this;
    for(var propertyName in placeholders) {
        var re = new RegExp('{' + propertyName + '}', 'gm');
        s = s.replace(re, placeholders[propertyName]);
    }
    return s;
};


var selectRowProp = {
  mode: "checkbox",  //checkbox for multi select, radio for single select.
  clickToSelect: true,   //click row will trigger a selection on that row.
  bgColor: "rgb(238, 193, 213)"   //selected row background color
};


class Disk extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      files: null,
      users: null,
      show_new_file: false,
      show_permissions: false,
      show_warning: false
    };
  }

  componentDidMount() {
    this.files_request = null;
    this.users_request = null;
    
    this.update();
  }

  componentWillUnmount() {
    this.files_request.abort();
    this.users_request.abort();
  }

  update() {
    this.setState({
      files: null,
      users: null
    });
    
    this.files_request = $.get(
      this.props.get_files_url,
      (result) => this.setState({files: result})
    );
    this.users_request = $.get(
      this.props.get_users_url,
      (result) => this.setState({users: result})
    );
  }
  
  getData() {
    if (this.getLoading()) {
      return [];
    }

    return _.map(this.state.files, (file, file_id) => ({
      id: file_id,
      name: file.name,
      type: file.type,
      creator: this.state.users[file.creator_id].username,
      access: file.access,
      last_modified: file.last_modified
    }));
  }

  getLoading() {
    return this.state.files === null ||
           this.state.users === null;
  }

  getSelectedFiles() {
    if (!this.refs.files_table) {
      return [];
    }
    return this.refs.files_table.state.selectedRowKeys;
  }

  anySelectedFiles() {
    return this.getSelectedFiles().length != 0;
  }

  newFile() {
    this.setState({
      show_new_file: true,
      show_warning: false
    });
  }

  uploadFile() {
    this.handleAlertDismiss();
  }

  deleteFiles() {
    if (!this.anySelectedFiles()) {
      this.setState({ show_warning: true });
    }

    this.handleAlertDismiss();
    this.getSelectedFiles().forEach((id) => {
      $.post(
        this.props.delete_file_url,
        {file_id: id},
        () => this.update()
      );
    });
  }

  editPermissions() {
    if (this.anySelectedFiles()) {
      this.setState({
        show_permissions: true,
        show_warning: false
      });
    } else {
      this.setState({ show_warning: true });
    }
  }
  
  nameFormatter(cell, row){
    return '<a href ="/ide/{id}/">{name}</a>'.format({id: row.id, name: cell})
  }

  typeFormatter(cell, row) {
    return this.props.file_extensions[cell]
  }

  permissionFormatter(cell, row) {
    if (cell == 'none') {
      throw 'None permission';
    } else if (cell == 'view') {
      return <Label bsStyle="primary">view</Label>;
    } else if (cell == 'edit') {
      return <Label bsStyle="success">edit</Label>;
    }
    throw 'Unknown permission: ' + cell;
  }

  handleAlertDismiss() {
    this.setState({ show_warning: false });
  }

  render() {
    var height = this.props.height;

    if (this.getLoading()) {
      return (
        <div className="row">
            <div className="loader">
              <span>{openingBracket()}</span><span>}</span>
            </div>
        </div>
      );
    }

    var notify;
    if (this.state.show_warning) {
      notify =
        <Alert bsStyle="danger" onDismiss={() => this.handleAlertDismiss()}>
          <strong>Select at least one file!</strong>
        </Alert>;
      height -= 280;
    } else {
      notify = <div></div>;
      height -= 205;
    }

    return (
      <div>
        <div className="row">
          {notify}
        </div>
        <div className="row">
          <ButtonGroup role="group" aria-label="edit-files">
            <Button onClick={() => this.newFile()}>
              New file
            </Button>
            <Button onClick={() => this.uploadFile()}>
              Upload file
            </Button>
            <Button onClick={() => this.deleteFiles()}>
              Delete files
            </Button>
            <Button onClick={() => this.editPermissions()}>
              Edit permissions
            </Button>
            <NewFile
              show={this.state.show_new_file}
              url={this.props.create_file_url}
              file_extensions={this.props.file_extensions}
              onUpdate={() => this.update()}
              onClose={() => this.setState({ show_new_file: false })}
            />
            <EditPermissions
              show={this.state.show_permissions}
              files={this.getSelectedFiles()}
              users={this.state.users}
              user_id={this.props.user_id}
              url={this.props.edit_permissions_url}
              get_permissions_url={this.props.get_permissions_url}
              onClose={() => this.setState({ show_permissions: false })}
            />
          </ButtonGroup>
          <BootstrapTable
            ref="files_table"
            data={this.getData()}
            hover={true}
            selectRow={selectRowProp}
            search={true}
            height={height.toString() + 'px'}
          >
            <TableHeaderColumn
              dataField="id" isKey={true} hidden={true}
            >#</TableHeaderColumn>
            <TableHeaderColumn
              dataField="name" dataFormat={(cell, row) => this.nameFormatter(cell, row)} dataSort={true}
            >Name</TableHeaderColumn>
            <TableHeaderColumn
              dataField="creator" dataSort={true} width="150"
            >Creator</TableHeaderColumn>
            <TableHeaderColumn
              dataField="access"
              dataSort={true}
              dataAlign="center"
              dataFormat={(cell, row) => this.permissionFormatter(cell, row)}
              width="90"
            >Access</TableHeaderColumn>
            <TableHeaderColumn
              dataField="type" dataFormat={(cell, row) => this.typeFormatter(cell, row)} dataSort={true} width="90"
            >Type</TableHeaderColumn>
            <TableHeaderColumn
              dataField="last_modified" dataSort={true} width="200"
            >Last modified</TableHeaderColumn>
          </BootstrapTable>
        </div>
      </div>
    );
  };
}


function getHeight() {
  var body = document.body, html = document.documentElement;

  return Math.max(
    body.scrollHeight, body.offsetHeight,
    html.clientHeight, html.scrollHeight, html.offsetHeight
  );
}

function getWidth() {
  var body = document.body, html = document.documentElement;

  return Math.max(
    body.scrollWidth, body.offsetWidth,
    html.clientWidth, html.scrollWidth, html.offsetWidth
  );
}


ReactDOM.render(
  <Disk
    user_id={document.getElementById('user_id').value}
    get_users_url='users/'
    get_files_url='files/'
    create_file_url='create_file/'
    delete_file_url='delete_file/'
    edit_permissions_url='edit_permissions/'
    get_permissions_url='permissions/'
    file_extensions={JSON.parse(document.getElementById('file_extensions').value)}
    height={getHeight()}
    width={getWidth()}
  />,
  document.getElementById('root')
);
