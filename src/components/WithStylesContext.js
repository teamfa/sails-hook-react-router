import { Component, PropTypes, Children } from 'react';

const propTypes = {
  children: PropTypes.element.isRequired,
  onInsertCss: PropTypes.func.isRequired,
};

const childContextTypes = {
  insertCss: PropTypes.func.isRequired,
};


class WithStylesContext extends Component {
  getChildContext() {
    return { insertCss: this.props.onInsertCss };
  }

  render() {
    return Children.only(this.props.children);
  }
}

WithStylesContext.propTypes = propTypes;
WithStylesContext.childContextTypes = childContextTypes;

export default WithStylesContext;
