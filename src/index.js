import React, {Children} from 'react';
import serverRouter from './router/server';
import renderReactRouteResponse from './responses/renderReactRoute';

export default function (sails) {

  if (!sails.config.react || !sails.config.react.routes) {
    sails.log.warn('Sails React: No routes config was provided at sails.config.react.routes, ' +
      'import your routes in the config file.');
    return {};
  }

  return {

    __routesRequired: {},

    sailsLifted: false,

    configure() {
    },

    /**
     * Sails hook initializer.
     * @param cb
     */
    initialize: function (cb) {
      cb();

      sails.on('lifted', () => {
        this.sailsLifted = true;
      });

      if (sails.config.webpack && sails.config.webpack.config) {
        sails.after('hook:sails-hook-webpack:compiler-ready', () => {
          this.loadRoutes(sails.config.react.routes);
          sails.on('hook:sails-hook-webpack:after-build', this.onWebpackUpdate);
        });
      } else {
        sails.log.warn('sails-hook-react-router: no webpack configuration has been detected, hot' +
          ' reloading of you react-router routes and sails controllers will be disabled.');
        this.loadRoutes(sails.config.react.routes);
      }

    },

	  /**
     *
     * @param path
     * @param clearCache
     */
    loadRoutes(path, clearCache) {
      if (clearCache) {
        try {
          delete require.cache[require.resolve(path)];
        } catch (e) {
        }
      }

      try {
        this.__routesRequired = require(path);
        this.iterateRouteChildren(this.__routesRequired);
      } catch (e) {
        sails.log.error('sails-hook-react-router: Could not find the routes file you specified.');
        sails.log.error(`sails-hook-react-router: ${path}`);
      }
    },

    /**
     * Reloads all routes and sails controllers, services and blueprints.
     * @param stats
     */
    onWebpackUpdate: function (stats) {
      const _this = this; // sails loadAndRegisterControllers overrides binding =/

      sails.log.verbose("Detected webpack change -- reloading sails routes and react components.");

      this.loadRoutes(sails.config.react.routes, true);

      if (this.sailsLifted) {
        // hot reload sails and react routes.
        sails.hooks.controllers.loadAndRegisterControllers(function () {
          // Reload locales
          if (sails.hooks.i18n) {
            sails.hooks.i18n.initialize(()=> {
            });
          }
          // Reload services
          sails.hooks.services.loadModules(()=> {
          });

          // Reload blueprints on controllers
          sails.hooks.blueprints.extendControllerMiddleware();

          // Flush router
          sails.router.flush();

          // Reload blueprints
          sails.hooks.blueprints.bindShadowRoutes();

          // create react-router routes
          _this.iterateRouteChildren(_this.__routesRequired);
        });
      }
    },

    /**
     * Add a route handler for the given path. This internally routes through react-router
     * and renders a route.
     * @param name
     * @param path
     */
    addRoute: function (name, path) {
      if (name && name.length) {
        name = name.charAt(0).toUpperCase() + name.substr(1);
      } else {
        name = null;
      }
      sails.log.verbose(`Sails React: Added new route "${name}" to path "${path}"`);
      this.routes.after[`GET ${path}`] = this._routerMiddleware(name, path);
    },

    /**
     * Iterates through all react-router routes and their children and binds
     * sails routes.
     * @param routeComponent
     * @param parentPath
     */
    iterateRouteChildren: function (routeComponent, parentPath) {
      if (!parentPath && routeComponent.props.path) {
        this.addRoute(routeComponent.props.name, routeComponent.props.path);
        parentPath = parentPath ? parentPath + routeComponent.props.path : routeComponent.props.path;
      }

      if (routeComponent.props.children) {
        Children.forEach(routeComponent.props.children, (child) => {
          if (parentPath && !parentPath.endsWith('/') && child.props.path && !child.props.path.startsWith('/')) {
            parentPath = parentPath + '/';
          }

          const pathWithParent = parentPath ? parentPath + child.props.path : child.props.path;

          if (child.props.path) {
            this.addRoute(child.props.name, pathWithParent);
          }

          if (child.props && child.props.children) {
            this.iterateRouteChildren(child, pathWithParent);
          }
        });
      }
    },

    /**
     * TODO
     * @param name
     * @param path
     * @returns {function()}
     * @private
     */
    _routerMiddleware: function _routerMiddleware(name, path) {
      return (req, res) => {
        req.react.name = name;
        req.react.path = path;
        sails.log.verbose(`Sails React: _routerMiddleware - ${req.url}`);
        return serverRouter(req, res);
      }
    },

    routes: {
      before: {
        'GET /*': function (req, res, next) {
          // add the default react object to req for use on renderServerRoute
          req.react = {
            title: '',
            state: null,
            props: {}
          };
          // attach the custom renderReactRoute response for use in user policies and controllers.
          res.renderReactRoute = renderReactRouteResponse(req, res);
          return next();
        }
      },
      after: {}
    }
  }

}
