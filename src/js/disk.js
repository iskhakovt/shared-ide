/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import Cookies from 'js-cookie'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { Alert, Button, ButtonGroup } from 'react-bootstrap';

import NewFile from './new_file-build'
import EditPermissions from './edit_permissions-build'


var csrftoken = Cookies.get('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});


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
      data: null,
      show_new_file: false,
      show_permissions: false,
      show_warning: false
    };
  }

  componentDidMount() {
    this.update();
  }

  componentWillUnmount() {
    this.serverRequest.abort();
  }
  
  nameFormatter(cell, row){
    return '<a href ="/ide/{id}/">{name}</a>'.format({id: row.id, name: cell})
  }

  typeFormatter(cell, row) {
    return this.props.file_extensions[cell]
  }

  update() {
    this.serverRequest = $.get(this.props.get_files_url, function (result) {
      this.setState({
        data: result.files
      });
    }.bind(this));
  }

  anySelected() {
    return this.refs.table && this.refs.table.state.selectedRowKeys.length != 0;
  }

  deleteFiles() {
    if (!this.anySelected()) {
      this.setState({ show_warning: true });
    }

    this.refs.table.state.selectedRowKeys.forEach((id) => {
      $.post(
        this.props.delete_file_url,
        {file_id: id},
        () => this.update()
      );
    });
  }

  editPermissions() {
    if (this.anySelected()) {
      this.setState({ show_permissions: true });
    } else {
      this.setState({ show_warning: true });
    }
  }

  handleAlertDismiss() {
    this.setState({ show_warning: false });
  }

  render() {
    var body = document.body,
    html = document.documentElement;

    var height = Math.max( body.scrollHeight, body.offsetHeight,
                           html.clientHeight, html.scrollHeight, html.offsetHeight );

    if (this.state.data === null) {
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
      notify = <Alert bsStyle="danger" onDismiss={() => this.handleAlertDismiss()}>
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
            <Button onClick={() => this.setState({ show_new_file: true })}>
              New file
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
              files={() => this.refs.table.state.selectedRowKeys}
              url={this.props.edit_permissions_url}
              get_url={this.props.get_permissions_url}
              onClose={() => this.setState({ show_permissions: false })}
            />
          </ButtonGroup>
          <BootstrapTable
            ref="table"
            data={this.state.data}
            hover={true}
            selectRow={selectRowProp}
            search={true}
            height={height.toString() + 'px'}
          >
            <TableHeaderColumn
              dataField="id"isKey={true} hidden={true}
            >#</TableHeaderColumn>
            <TableHeaderColumn
              dataField="name" dataFormat={(cell, row) => this.nameFormatter(cell, row)} dataSort={true}
            >Name</TableHeaderColumn>
            <TableHeaderColumn
              dataField="creator" dataSort={true} width="150"
            >Creator</TableHeaderColumn>
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


ReactDOM.render(
  <Disk
    get_files_url='files/'
    create_file_url='create_file/'
    delete_file_url='delete_file/'
    edit_permissions_url='edit_permissions/'
    get_permissions_url='permissions/'
    file_extensions={JSON.parse(document.getElementById('file_extensions').value)}
  />,
  document.getElementById('root')
);
