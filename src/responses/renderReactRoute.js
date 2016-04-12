import { serverRouter } from './../router';

/**
 * Returns a sails response so res.renderServerResponse can be used in policies
 * and controllers.
 * @param req
 * @param res
 * @returns {Function}
 * @private
 */
export default function renderReactRouteResponse(req, res) {
  return function response(props, routeOverride) {
    if (routeOverride) {
      req.url = routeOverride;
    }

    if (props) {
      Object.assign(req.react.props, props);
    }

    return serverRouter(req, res);
  };
}
