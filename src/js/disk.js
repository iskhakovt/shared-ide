/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import Cookies from 'js-cookie'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { Button } from 'react-bootstrap';

import NewFile from './new_file-build'


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
      show_permissions: false
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
    this.refs.table.state.selectedRowKeys.forEach((id) => {
      $.post(
        this.props.delete_file_url,
        {file_id: id},
        () => update()
      );
    });
  }

  render() {
    if (this.state.data === null) {
      return (
        <div className="row">
            <div className="loader">
              <span>{openingBracket()}</span><span>}</span>
            </div>
        </div>
      );
    }

    return (
      <div className="row">
        <div className="col-md-2">
          <Button
            bsStyle="primary"
            bsSize="large"
            onClick={() => this.setState({ show_new_file: true })}
          >
            New file
          </Button>
          <Button
            bsStyle="primary"
            bsSize="large"
            onClick={() => this.deleteFiles()}
          >
            Delete files
          </Button>
          <Button
            bsStyle="primary"
            bsSize="large"
            onClick={() => { if (this.anySelected()) this.setState({ show_permissions: true })} }
          >
            Edit permissions
          </Button>
          <NewFile
            show={this.state.show_new_file}
            url={this.props.create_file_url}
            file_extensions={this.props.file_extensions}
            onUpdate={() => this.update()}
            onClose={() => this.setState({ show_new_file: false })}
          />
        </div>
        <div className="col-md-10">
          <BootstrapTable
            ref="table"
            data={this.state.data}
            striped={true}
            hover={true}
            selectRow={selectRowProp}
            search={true}
          >
            <TableHeaderColumn
              dataField="id"isKey={true} hidden={true} width="30"
            >#</TableHeaderColumn>
            <TableHeaderColumn
              dataField="name" dataFormat={(cell, row) => this.nameFormatter(cell, row)} dataSort={true}
            >name</TableHeaderColumn>
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
