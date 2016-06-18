/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import $ from 'jquery'
import _ from 'lodash';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { Alert, Button, Modal, FormGroup, FormControl, ControlLabel, Label } from 'react-bootstrap';


function openingBracket() {
  return "{";
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}

var selectRowProp = {
  mode: "checkbox",  //checkbox for multi select, radio for single select.
  clickToSelect: true,   //click row will trigger a selection on that row.
  bgColor: "rgb(238, 193, 213)"   //selected row background color
};


class EditPermissions extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      users: null,
      permissions: {}
    };
  }

  componentDidMount() {
    this.get_permission_requests = {};
    this.performing_requests = {};

    this.gotUsers(this.props.users, this.props.user_id);
    this.updateFiles(this.props.files);
  }
  
  componentWillReceiveProps(nextProps) {
    this.gotUsers(nextProps.users, nextProps.user_id);

    if (this.props.files !== nextProps.files) {
      this.updateFiles(nextProps.files);
    }
  }

  componentWillUnmount() {
    _.map(this.get_permission_requests, (request) => request.abort());
  }

  gotUsers(users, user_id) {
    var users_copy = clone(users);
    delete users_copy[user_id];

    this.setState({
      'users': users_copy
    });
  }

  gotPermissions(file_id, data) {
    var permissions = this.state.permissions;
    permissions[file_id] = {
      'view': new Set(data.view),
      'edit': new Set(data.edit)
    };

    delete this.get_permission_requests[file_id];

    this.setState({
      'permissions': permissions
    });
  }
  
  updateFiles(files) {
    this.setState({
      permissions: {}
    });

    files.forEach((file_id) => {
      if (this.get_permission_requests[file_id]) {
        this.get_permission_requests[file_id].abort();
      }

      this.get_permission_requests[file_id] = $.get(
        this.props.get_permissions_url,
        {'file_id': file_id},
        (result) => this.gotPermissions(file_id, result)
      ).fail(
        () => setTimeout(this.updateFiles(files), 500)
      );
    });
  }

  getData() {
    if (this.getLoading()) {
      return [];
    }

    return _.map(this.state.users, (user, user_id) => ({
      'id': user_id,
      'username': user.username,
      'access': this.getPermissions(parseInt(user_id))
    }));
  }

  getLoading() {
    return this.state.users === null ||
           Object.keys(this.state.permissions).length != this.props.files.length;
  }

  getPermissions(user_id) {
    var permissions = _.map(this.state.permissions, (file) => {
      if (file.edit.has(user_id)) return 'edit';
      if (file.view.has(user_id)) return 'view';
      return 'none';
    });

    return this.minPermission(permissions);
  }

  minPermission(permissions) {
    if (permissions.indexOf('none') != -1) {
      return 'none';
    }
    if (permissions.indexOf('view') != -1) {
      return 'view';
    }
    if (permissions.indexOf('edit') != -1) {
      return 'edit';
    }
    return '';
  }

  permissionFormatter(cell, row) {
    if (cell == 'none') {
      return <Label bsStyle="default">none</Label>
    } else if (cell == 'view') {
      return <Label bsStyle="primary">view</Label>;
    } else if (cell == 'edit') {
      return <Label bsStyle="success">edit</Label>;
    }

    throw 'Unknown permission: ' + cell;
  }

  postFinished(request) {
    delete this.performing_requests[request];

    if (!Object.keys(this.performing_requests).length) {
      this.updateFiles(this.props.files);
    }
  }

  submit(access) {
    this.setState({
      permissions: {}
    });

    this.refs.users_table.state.selectedRowKeys.forEach((user_id) => {
      this.props.files.forEach((file_id) => {
        var key = {user_id: file_id};
        if (this.performing_requests[key]) {
          this.performing_requests[key].abort();
        }

        this.performing_requests[key] = $.post(
          this.props.url,
          {'file_id': file_id, 'user_id': user_id, 'access': access}
        ).always(() => this.postFinished(key));
      });
    });
  }

  close() {
    this.props.onClose();
  }

  render() {
    if (this.props.files.length == 0 && this.props.show) {
      throw "No files in edit permissions";
    }

    var body, footer;

    if (this.getLoading()) {
      body =
        <div className="loader">
          <span>{openingBracket()}</span><span>}</span>
        </div>;
      footer = <div></div>;
    } else {
      body =
        <row>
          <Alert bsStyle="warning">
            Note that you cannot change the permissions for the creator of the file.
          </Alert>
          <BootstrapTable
            ref="users_table"
            data={this.getData()}
            hover={true}
            selectRow={selectRowProp}
          >
            <TableHeaderColumn
              dataField="id" isKey={true} hidden={true}
            >#</TableHeaderColumn>
            <TableHeaderColumn
              dataField="username" dataSort={true}
            >Name</TableHeaderColumn>
            <TableHeaderColumn
                dataField="access"
                dataSort={true}
                dataAlign="center"
                dataFormat={(cell, row) => this.permissionFormatter(cell, row)}
                width="90"
              >Access</TableHeaderColumn>
          </BootstrapTable>
        </row>;
      footer =
        <row>
          <div className="col-md-3">
            <Button onClick={() => this.submit('none')}>
              None
            </Button>
          </div>
          <div className="col-md-3">
            <Button onClick={() => this.submit('view')}>
              View
            </Button>
          </div>
          <div className="col-md-3">
            <Button onClick={() => this.submit('edit')}>
              Edit
            </Button>
          </div>
        </row>;
    }

    return (
      <Modal
        show={this.props.show}
        onHide={() => this.close()}
        container={this}
        bsSize="lg"
        aria-labelledby="contained-modal-edit-permissions-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-edit-permissions-title">Edit permissions</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {body}
        </Modal.Body>
        <Modal.Footer>
          {footer}
        </Modal.Footer>
      </Modal>
    );
  };
}


export default EditPermissions;
