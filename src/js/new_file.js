/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import $ from 'jquery'
import { Button, Modal, FormGroup, FormControl, ControlLabel } from 'react-bootstrap';


class NewFile extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      name: '',
      type: '',
      nameValidationState: null,
      typeValidationState: null
    };
  }

  submit() {
    if (this.state.name == '') {
      this.setState({
        nameValidationState: 'error'
      });
    }
    if (this.state.type == '') {
      this.setState({
        typeValidationState: 'error'
      });
    }

    if (this.state.name == '' || this.state.type == '') {
      return;
    }

    $.post(
      this.props.url,
      { name: this.state.name, type: this.state.type },
      () => this.props.onUpdate()
    );
    
    this.close();
  }

  close() {
    this.props.onClose();
  }

  handleNameChange(e) {
    var name = e.target.value;

    if (name == '') {
      this.setState({ name: name });
    } else {
      this.setState({
        name: name,
        nameValidationState: null
      });
    }
  }

  handleTypeChange(e) {
    this.setState({
      type: e.target.value,
      typeValidationState: null
    });
  }

  render() {
    return (
      <Modal
        show={this.props.show}
        onHide={() => this.close()}
        container={this}
        aria-labelledby="contained-modal-title"
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title">New file</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <FormGroup
              controlId="formControlsName"
              validationState={this.state.nameValidationState}
            >
              <ControlLabel>File name</ControlLabel>
              <FormControl
                type="text"
                value={this.state.name}
                placeholder="File name"
                onChange={(e) => this.handleNameChange(e)}
              />
            </FormGroup>
            <FormGroup
              controlId="formControlsType"
              validationState={this.state.typeValidationState}
            >
              <ControlLabel>Select</ControlLabel>
              <FormControl
                componentClass="select"
                value={this.state.type}
                placeholder="File type"
                onChange={(e) => this.handleTypeChange(e)}
              >
                <option disabled value="" />
                {Object.keys(this.props.file_extensions).map((extension) => {
                  return <option key={extension} value={extension}>{this.props.file_extensions[extension]}</option>
                })}
              </FormControl>
            </FormGroup>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={() => this.submit()}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };
}

export default NewFile;
