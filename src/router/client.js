import React from 'react';
import { render } from 'react-dom';
import { sailsReactRouter } from './';
import createLocation from 'history/lib/createLocation';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import WithStylesContext from './../components/WithStylesContext';

/**
 * Render a route client side, uses document.location
 * @param routes
 * @param props
 */
export default function (routes, props) {
  if (__CLIENT__) {
    const location = createLocation(document.location.pathname, document.location.search);
    const history = createBrowserHistory();

    if (props && window.__ReactInitState__) {
      Object.assign(window.__ReactInitState__, props);
    }

    sailsReactRouter(routes, location, history, {}) // state: window.__ReactInitState__ || props
      .then((reactElement) => {
        render(
          <WithStylesContext onInsertCss={styles => styles._insertCss()}>
            {reactElement}
          </WithStylesContext>,
          document.getElementById('react-root'));
        if (!__DEBUG__) delete window.__ReactInitState__;
      }, (err) => {
        throw err;
      });
  }
}
