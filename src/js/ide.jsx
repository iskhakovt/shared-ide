/**
 * Copyright (c) Timur Iskhakov.
 */

import React from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'

import AceEditor from './editor-build'


class Editor extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      value: 'function f() {\n    console.log(\'hello world\');\n}',
      theme: 'solarized_light',
      fontSize: 12
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
  <Editor />,
  document.getElementById('root')
);
