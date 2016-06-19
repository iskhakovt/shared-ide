/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'
import ReactDOM from 'react-dom'
import $ from 'jquery'
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table'
import { Alert, ControlLabel, Button, FormControl, FormGroup, Tab, Tabs, Tooltip } from 'react-bootstrap'
import csrf from './csrf-build'


csrf($);


function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) ||
    [null, ''])[1].replace(/\+/g, '%20')) ||
    null;
}

function getNextUrl() {
  var next = getURLParameter('next');
  if (next) {
    return next;
  }
  return '/disk/';
}


class Auth extends React.Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      key: 'login',
      login_username: '',
      login_password: '',
      register_username: '',
      register_first_name: '',
      register_last_name: '',
      register_email: '',
      register_password: '',
      login_username_invalid: null,
      login_password_invalid: null,
      register_username_invalid: null,
      register_first_name_invalid: null,
      register_last_name_invalid: null,
      register_email_invalid: null,
      register_password_invalid: null,
      post: false,
      failed_text: ''
    };
  }

  handleChange(e, prop, valid) {
    var value = e.target.value;
    var state = {};

    state[prop] = value;
    if (value != '') {
      state[valid] = null;
    }

    this.setState(state);
  }

  login() {
    this.setState({
      failed_text: ''
    });

    if (this.state.login_username == '') {
      this.setState({
        login_username_invalid: 'error'
      });
    }
    if (this.state.login_password == '') {
      this.setState({
        login_password_invalid: 'error'
      });
    }

    if (this.state.login_username == '' || this.state.login_password == '') {
      return;
    }

    this.setState({
      post: true
    });

    $.post(
      '/login/',
      {
        username: this.state.login_username,
        password: this.state.login_password
      }
    ).done(
      () => window.location.replace(this.props.next)
    ).fail(
      (data) => this.setState({
        failed_text: data['responseText'] == 'incorrect' ? 'Incorrect login or password.' : '',
        post: false
      })
    )
  }

  checkEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  checkPassword(password) {
    return password.length >= 8;
  }

  register() {
    this.setState({
      failed_text: ''
    });

    if (this.state.register_username == '') {
      this.setState({
        register_username_invalid: 'error'
      });
    }
    if (this.state.register_first_name == '') {
      this.setState({
        register_first_name_invalid: 'error'
      });
    }
    if (this.state.register_last_name == '') {
      this.setState({
        register_last_name_invalid: 'error'
      });
    }
    if (!this.checkEmail(this.state.register_email)) {
      this.setState({
        register_email_invalid: 'error'
      });
    }
    if (!this.checkPassword(this.state.register_password)) {
      this.setState({
        register_password_invalid: 'error'
      });
    }

    if (
      this.state.register_username == '' ||
      this.state.register_first_name == '' ||
      this.state.register_last_name == '' ||
      this.state.register_email == '' ||
      this.state.register_password == ''
    ) {
      return;
    }

    this.setState({
      post: true
    });

    $.post(
      '/registration/',
      {
        username: this.state.register_username,
        first_name: this.state.register_first_name,
        last_name: this.state.register_last_name,
        email: this.state.register_email,
        password: this.state.register_password
      }
    ).done(
      () => window.location.replace(this.props.next)
    ).fail(
      (data) => {
        this.setState({
          failed_text: data['responseText'] == 'username-exists' ? 'Username is used' : '',
          post: false
        })
      }
    )
  }

  changeMode() {
    var next_key;
    
    if (this.state.key == 'login') {
      next_key = 'registration';
    } else {
      next_key = 'login';
    }

    this.setState({
      key: next_key,
      login_username_invalid: null,
      login_password_invalid: null,
      register_username_invalid: null,
      register_first_name_invalid: null,
      register_last_name_invalid: null,
      register_email_invalid: null,
      register_password_invalid: null,
      failed_text: ''
    });
  }

  render() {
    var disabled =  this.state.post ? true : null;
    var alert, button_stile, signup_button_text, change_button_style;
    
    if (this.state.key == 'login') {
      change_button_style='change-auth-signin';
    } else {
      change_button_style='change-auth';
    }

    if (this.state.register_password && this.state.register_password_invalid) {
      signup_button_text = 'Password is too short';
    } else {
      signup_button_text = 'Sign up';
    }

    if (this.state.failed_text) {
      alert = <Alert bsStyle="danger"><p>{this.state.failed_text}</p></Alert>;
    } else {
      alert = <div></div>;
    }

    if (
      this.state.login_username_invalid ||
      this.state.login_password_invalid ||
      this.state.register_username_invalid ||
      this.state.register_first_name_invalid ||
      this.state.register_last_name_invalid ||
      this.state.register_email_invalid ||
      this.state.register_password_invalid
    ) {
      button_stile = 'danger';
    } else {
      button_stile = 'primary';
    }

    var login_form =
      <form className="form-auth">
        <h2>Please sign in</h2>
        {alert}
        <FormGroup validationState={this.state.login_username_invalid}>
          <FormControl
            type="text"
            placeholder="Login"
            className="username"
            value={this.state.login_username}
            onChange={(e) => this.handleChange(e, 'login_username', 'login_username_invalid')}
          />
        </FormGroup>
        <FormGroup validationState={this.state.login_password_invalid}>
          <FormControl
            type="password"
            placeholder="Password"
            value={this.state.login_password}
            onChange={(e) => this.handleChange(e, 'login_password', 'login_password_invalid')}
          />
        </FormGroup>
        <Button
          bsStyle={button_stile}
          type="button"
          bsSize="large"
          block
          onClick={() => this.login()}
          disabled={disabled}
        >
          Sign in
        </Button>
      </form>;

    var register_form =
      <form className="form-auth">
        <h2>Please sign up</h2>
        {alert}
        <FormGroup validationState={this.state.register_username_invalid}>
          <FormControl
            type="text"
            placeholder="Login"
            className="username"
            value={this.state.register_username}
            onChange={(e) => this.handleChange(e, 'register_username', 'register_username_invalid')}
          />
        </FormGroup>
        <FormGroup validationState={this.state.register_first_name_invalid}>
          <FormControl
            type="text"
            placeholder="First name"
            className="name"
            value={this.state.register_first_name}
            onChange={(e) => this.handleChange(e, 'register_first_name', 'register_first_name_invalid')}
          />
        </FormGroup>
        <FormGroup validationState={this.state.register_last_name_invalid}>
          <FormControl
            type="text"
            placeholder="Last name"
            className="name"
            value={this.state.register_last_name}
            onChange={(e) => this.handleChange(e, 'register_last_name', 'register_last_name_invalid')}
          />
        </FormGroup>
        <FormGroup validationState={this.state.register_email_invalid}>
          <FormControl
            type="email"
            placeholder="Email"
            value={this.state.register_email}
            onChange={(e) => this.handleChange(e, 'register_email', 'register_email_invalid')}
          />
        </FormGroup>
        <FormGroup validationState={this.state.register_password_invalid}>
          <FormControl
            type="password"
            placeholder="Password"
            value={this.state.register_password}
            onChange={(e) => this.handleChange(e, 'register_password', 'register_password_invalid')}
          />
        </FormGroup>
        <Button
          bsStyle={button_stile}
          type="button"
          bsSize="large"
          block
          onClick={() => this.register()}
          disabled={disabled}
        >
          {signup_button_text}
        </Button>
      </form>;

    var next_text, form;

    if (this.state.key == 'login') {
      next_text = 'Sign up';
      form = login_form;
    } else if (this.state.key == 'registration') {
      next_text = 'Sign in';
      form = register_form;
    } else {
      throw 'Unknown key: ' + this.state.key;
    }

    return (
      <row>
        {form}
        <h2 className={change_button_style}>
          <a className="dot" onClick={() => this.changeMode()}>
            {next_text}
          </a>
        </h2>
      </row>
    );
  };
}


ReactDOM.render(
  <Auth
    next={getNextUrl()}
  />,
  document.getElementById('root')
);
