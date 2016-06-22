/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ace from 'brace'
import 'brace/theme/solarized_light'
import 'brace/mode/python'
import 'brace/mode/c_cpp'
import 'brace/ext/language_tools'
import _ from 'lodash'

import deepCompare from './compare-build'

var aceRange = ace.acequire('ace/range').Range;


class AceEditor extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      markers: {},
      cursor: null
    };
  }

  componentDidMount() {
    this.editor = ace.edit(this.props.name);
    this.editor.$blockScrolling = Infinity;
    this.editor.getSession().setMode('ace/mode/' + this.props.mode);
    this.editor.setTheme('ace/theme/' + this.props.theme);
    this.editor.setFontSize(this.props.fontSize);
    this.editor.setValue(this.props.defaultValue || this.props.value, (this.props.selectFirstLine === true ? -1 : null));
    this.editor.setOption('maxLines', this.props.maxLines);
    this.editor.setOption('readOnly', this.props.readOnly);
    this.editor.setOption('highlightActiveLine', this.props.highlightActiveLine);
    this.editor.setShowPrintMargin(this.props.setShowPrintMargin);
    this.editor.getSession().setUseWrapMode(this.props.wrapEnabled);
    this.editor.renderer.setShowGutter(this.props.showGutter);
    this.editor.setOption('showLineNumbers', this.props.showLineNumbers);

    this.state.cursor = this.props.cursor;
    
    this.editor.getSelection().on(
      'changeCursor',
      (e, selection) => {
        if (selection.getCursor().row || selection.getCursor().column)
          this.props.onCursorChange(selection.getCursor()); }
    );
    this.editor.getSelection().moveCursorToPosition(this.props.cursor);

    if (this.props.onChange) {
      this.editor.on('change', (e) => {
        /* Check that the changes were made by user */
        if (this.editor.curOp && this.editor.curOp.command.name) {
          this.props.onChange(e);
        }
      });
    }

    if (this.props.onLoad) {
      this.props.onLoad(this.editor);
    }

    this.updateMarkers(this.props.markers);
  }

  componentWillReceiveProps(nextProps) {
    let currentRange = this.editor.selection.getRange();

    // only update props if they are changed
    if (nextProps.mode !== this.props.mode) {
      this.editor.getSession().setMode('ace/mode/' + nextProps.mode);
    }
    if (nextProps.theme !== this.props.theme) {
      this.editor.setTheme('ace/theme/' + nextProps.theme);
    }
    if (nextProps.fontSize !== this.props.fontSize) {
      this.editor.setFontSize(nextProps.fontSize);
    }
    if (nextProps.maxLines !== this.props.maxLines) {
      this.editor.setOption('maxLines', nextProps.maxLines);
    }
    if (nextProps.readOnly !== this.props.readOnly) {
      this.editor.setOption('readOnly', nextProps.readOnly);
    }
    if (nextProps.highlightActiveLine !== this.props.highlightActiveLine) {
      this.editor.setOption('highlightActiveLine', nextProps.highlightActiveLine);
    }
    if (nextProps.setShowPrintMargin !== this.props.setShowPrintMargin) {
      this.editor.setShowPrintMargin(nextProps.setShowPrintMargin);
    }
    if (nextProps.wrapEnabled !== this.props.wrapEnabled) {
      this.editor.getSession().setUseWrapMode(nextProps.wrapEnabled);
    }
    if (nextProps.value !== null && this.editor.getValue() !== nextProps.value) {
      this.editor.setValue(nextProps.value, (this.props.selectFirstLine === true ? -1 : null));
      if (currentRange && typeof currentRange === 'object') {
        this.editor.getSession().getSelection().setSelectionRange(currentRange);
      }
    }
    if (nextProps.showGutter !== this.props.showGutter) {
      this.editor.renderer.setShowGutter(nextProps.showGutter);
    }
    
    if (nextProps.showLineNumbers !== this.props.showLineNumbers) {
      this.editor.setOption('showLineNumbers', nextProps.showLineNumbers);
    }
    
    this.updateMarkers(nextProps.markers);

    if (nextProps.onCursorChange !== this.props.onCursorChange) {
      this.editor.getSelection().on(
        'changeCursor',
        (e, selection) => {
          if (!deepCompare(selection.getCursor(), nextProps.cursor)) {
            nextProps.onCursorChange(selection.getCursor())
          }
        }
      );
    }
    if (!deepCompare(nextProps.cursor, this.state.cursor) &&
       !deepCompare(nextProps.cursor, this.editor.getSelection().getCursor())) {
      this.setState({cursor: nextProps.cursor});
      this.editor.getSelection().moveCursorToPosition(nextProps.cursor);
    }
  }

  updateMarkers(markers) {
    var newMarkers = {};
    var toPush = false;

    _.forEach(
      markers,
      (value, key) => {
        if (!(key in this.state.markers) ||
            !deepCompare(value, this.state.markers[key].value)) {
          toPush = true;

          if (key in this.state.markers) {
            this.editor.session.removeMarker(this.state.markers[key].id);
          }
          var id = this.editor.session.addMarker(
            new aceRange(
              value.pos.row, value.pos.column, value.pos.row, value.pos.column + value.username.length
            ),
            key,
            true
          );

          newMarkers[key] = {id: id, value: value};

          // That is awful, I know

          var style = document.head.appendChild(document.createElement('style'));
          style.innerHTML = '.' + key + '{ position: absolute; ' +
            'background: + rgba(100,100,200,0.5); z-index: 40;' +
            'width: 2px !important; }';

          var styleBefore = document.head.appendChild(document.createElement('style'));
          styleBefore.innerHTML = '.' + key + '::before{ position: absolute; ' +
            'background: rgba(100,100,200,0.5); z-index: 999; top: -100%;' +
            'left: 0px; font-family: Arial; padding: 1px 2px;' +
            'content: "' + value.username + '";}';
        }
      }
    );

    if (toPush) {
      this.setState({
        markers: newMarkers
      });
    }
  }

  render() {
    return React.DOM.div({
      id: this.props.name,
      onChange: this.onChange
    });
  }
}


export default AceEditor;
