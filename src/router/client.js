import React from 'react';
import { render } from 'react-dom';
import { sailsReactRouter } from './';
import createLocation from 'history/lib/createLocation';
import createBrowserHistory from 'history/lib/createBrowserHistory';
import WithStylesContext from './../components/WithStylesContext';

const defaultClientOptions = {
  reactRootElementId: 'react-root',
  isomorphicStyleLoader: true,
};

/**
 * Render a route client side, uses document.location
 * @param routes your routes file
 * @param props additional props to mount
 * @param options router options, see client router options
 */
export default function (routes, props, options) {
  if (!__CLIENT__) {
    return null;
  }

  if (!options) {
    options = defaultClientOptions;
  } else {
    options = Object.assign(defaultClientOptions, options);
  }

  const location = createLocation(document.location.pathname, document.location.search);
  const history = createBrowserHistory();

  if (props && window.__ReactInitState__) {
    Object.assign(window.__ReactInitState__, props);
  }

  return sailsReactRouter(routes, location, history, { state: window.__ReactInitState__ })
    .then((component) => {
      let renderComponents;

      if (options.isomorphicStyleLoader) {
        renderComponents = (
          <WithStylesContext onInsertCss={
            styles => {
              if (Array.isArray(styles)) {
                styles.forEach(style => style._insertCss());
              } else {
                styles._insertCss();
              }
            }
          }
          >
            {component}
          </WithStylesContext>
        );
      } else {
        renderComponents = component;
      }

      if (!__DEBUG__) {
        delete window.__ReactInitState__;
      }

      return render(renderComponents, document.getElementById(options.reactRootElementId));
    })
    .catch((err) => {
      throw err;
    });
}
