/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import $ from 'jquery'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import { Button, Modal, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';


var selectRowProp = {
  mode: "checkbox",  //checkbox for multi select, radio for single select.
  clickToSelect: true,   //click row will trigger a selection on that row.
  bgColor: "rgb(238, 193, 213)"   //selected row background color
};


class EditPermissions extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {

    };
  }

  close() {
    this.props.onClose();
  }

  render() {
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
          <BootstrapTable
            ref="none"
            data={[]}
            hover={true}
            selectRow={selectRowProp}
          >
            <TableHeaderColumn
              dataField="id" isKey={true} hidden={true}
            >#</TableHeaderColumn>
            <TableHeaderColumn
              dataField="name"
            >Name</TableHeaderColumn>
          </BootstrapTable>
        </Modal.Body>
        <Modal.Footer>
          <row>
            <div className="col-md-3">
              <Button onClick={() => this.submit()}>
                None
              </Button>
            </div>
            <div className="col-md-3">
              <Button onClick={() => this.submit()}>
                View
              </Button>
            </div>
            <div className="col-md-3">
              <Button onClick={() => this.submit()}>
                Edit
              </Button>
            </div>
          </row>
        </Modal.Footer>
      </Modal>
    );
  };
}

export default EditPermissions;
