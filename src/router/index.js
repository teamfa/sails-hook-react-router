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
 * @param reqOrProps
 * @param res
 * @returns {Promise}
 * @constructor
 */
export function sailsReactRouter(routes, location, history, reqOrProps, res) {
  return new Promise((resolve, reject) => {
    match({routes, location, history}, (error, redirectLocation, renderProps) => {
      if (error) {
        return reject(error);
      }

      // if we're on the server and have a <Redirect/> location res.redirect to it.
      if (__SERVER__ && res && redirectLocation) {
        return res.redirect(302, redirectLocation.pathname + redirectLocation.search)
      }

      // no renderProps so no valid route - send 404 if on server
      if (__SERVER__ && !renderProps) {
        return res.notFound({location});
      }

      if (renderProps) {
        renderProps.history = history;
      } else {
        renderProps = {};
      }

      // merge in any user props added onto req via polices and such.
      if (__SERVER__ && reqOrProps && reqOrProps.react && reqOrProps.react.props) {
        Object.assign(renderProps, reqOrProps.react.props);
      }

      // attach the final state onto reqOrProps.react for window.__ReactInitState__
      if (__SERVER__ && reqOrProps && reqOrProps.react) {
        reqOrProps.react.state = reqOrProps.react.props;
      }

      // client side check for window.__ReactInitState__;
      if (__CLIENT__ && reqOrProps && reqOrProps.state) {
        Object.assign(renderProps, reqOrProps.state || {});
      }

      return resolve(getRootComponent(renderProps, routes));
    });
  });
}
