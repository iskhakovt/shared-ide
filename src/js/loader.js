/**
 * Copyright (c) Timur Iskhakov.
 */


import React from 'react'


class Loader extends React.Component {
  constructor(props, context) {
    super(props, context);
  }

  render() {
    if (this.props.loading) {
      return (
        <div className="loader">
          <span>&#123;</span><span>&#125;</span>
        </div>
      );
    }

    return (
      <div>
        {this.props.children}
      </div>
    );
  }
}


export default Loader;
