import React  from 'react';
import {match, RouterContext} from 'react-router';

/**
 * Returns the root component to use in rendering react-router.
 *    - Differs between client and server.
 * @param renderProps
 * @param routerElement
 * @returns {*}
 */
export function getRootComponent(renderProps, routerElement) {
  if (__SERVER__) {
    return React.createElement(RouterContext, renderProps);
  }
  return React.cloneElement(routerElement, renderProps);
}

/**
 * Internal router that is used on client and server.
 *    - Automatically merges on props / state from req.react
 * @param routes
 * @param location
 * @param history
 * @param req
 * @returns {Promise}
 * @constructor
 */
export function sailsReactRouter(routes, location, history, req) {
  return new Promise((resolve, reject) => {
    match({routes, location, history}, (error, redirectLocation, renderProps) => {
      if (error) {
        return reject(error);
      }

      if (renderProps) {
        renderProps.history = history;
      } else {
        renderProps = {};
      }

      // merge in any user props added onto req via polices and such.
      // if (__SERVER__ && req && req.react && req.react.props) {
      //   Object.assign(renderProps, req.react.props);
      // }

      // client side check for window.__ReactInitState__;
      if (__CLIENT__ && req && req.state) {
        Object.assign(renderProps, req.state || {});
      }

      // attach the final state onto req.react for window.__ReactInitState__
      if (req && req.react) {
        req.react.state = req.react.props;
      }

      return resolve(getRootComponent(renderProps, routes));
    });
  });
}
