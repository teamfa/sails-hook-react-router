import { Children } from 'react';
import serverRouter from './router/server';
import renderReactRouteResponse from './responses/renderReactRoute';

export default function (sails) {
  return {

    __routesCompiled: {},

    defaults: {
      __configKey__: {
        // Resolved path to your webpack compiled react-router routes file,
        // therefore it's best not to clutter this file with anything except your routes
        // and their child components as these will be bundled.
        //
        // A path is used to allow watching in development - for hot reloads.
        //
        // e.g path.resolve(__dirname, './../.tmp/react-router/routes')
        //
        // See the starter project for an example webpack config to generate this file.
        routes: '',

        // hot reload routes, sails controllers, services etc after every webpack
        // build - this only applies to development.
        reloadOnWebpackBuild: true,

        // if you don't want to use isomorphic-style-loader
        // (https://github.com/kriasoft/isomorphic-style-loader)
        // then turn this off.
        // Note: if you turn this off then you'll also need to turn this off on the clientRouter
        // options also.
        isomorphicStyleLoader: true,

        // which router takes preference on route loading, 'sails' or 'react'
        // setting this to react will ignore sails routes that are identical to a react-router route
        // setting this to sails will ignore react-router routes that are identical to a sails route
        //
        // Note: this only applies to server side rendering - client rendered routes will always be
        // well... client rendered :P
        routingPreference: 'react',  // react or sails
      },
    },

    sailsLifted: false,

    /**
     * Sails hook initializer.
     * @param cb
     */
    initialize(cb) {
      const config = sails.config[this.configKey];

      if (!config || !config.routes) {
        sails.log.warn('shrr: No routes config was provided.');
        sails.log.warn('shrr: Please configure your config/react-router.js file.');
        return cb();
      }

      // keep an internal key to track sails lift state
      // maybe sails already has a var for this somewhere?
      sails.on('lifted', () => {
        this.sailsLifted = true;
      });

      // bind on extra polices and res methods
      // TODO polices
      sails.on('router:before', () => {
        if (sails.hooks.i18n) {
          sails.after('hook:i18n:loaded', () => {
            sails.router.bind('/*', this._addRenderReactRouteMethod, 'all', {});
          });
        } else {
          sails.router.bind('/*', this._addRenderReactRouteMethod, 'all');
        }
      });

      // bootstrap react-router routes or wait for webpack if installed and then bootstrap
      if (config.reloadOnWebpackBuild && sails.config.webpack && sails.config.webpack.config) {
        sails.after('hook:sails-hook-webpack:compiler-ready', () => {
          this._loadRoutes(config.routes); // need to load here also bleh.
          sails.on('hook:sails-hook-webpack:after-build', this._onWebpackUpdate);
        });
      } else {
        sails.log.warn('shrr: no webpack configuration has been detected, hot' +
          ' reloading of you react-router routes and sails controllers will be disabled.');
        this._loadRoutes(config.routes);
      }

      return cb();
    },

    /**
     * Reloads the routes module via require, optionally clears require cache.
     * @param path
     * @param clearCache
     * @private
     */
    _loadRoutes(path, clearCache) {
      if (clearCache) {
        try {
          delete require.cache[require.resolve(path)];
        } catch (e) {
          sails.log.debug('shrr: Error deleting require cache this is ' +
            'generally nothing to worry about!');
        }
      }

      try {
        this.__routesCompiled = require(path);
      } catch (e) {
        console.error(e);
        sails.log.error('shrr: Could not find the routes file you specified or there was an error' +
          ' in the file.');
        sails.log.error(`shrr: ${path}`);
      }

      if (this.__routesCompiled) {
        this._iterateRouteChildren(this.__routesCompiled);
      }

    },

    /**
     * Reloads all react-router routes, sails controllers, services and blueprints.
     * TODO needs some more tweaks, will pull this out and use chokidir to watch for sails
     * TODO specific changes, rather than reloading everything all the time
     * TODO Extend to include models, policies and sails config
     * @private
     */
    _onWebpackUpdate() {
      const _this = this; // sails loadAndRegisterControllers overrides binding =/

      sails.log.verbose('shrr: webpack after build - reloading sails routes and react components.');

      if (this.sailsLifted) {
        // hot reload sails and react routes.
        sails.hooks.controllers.loadAndRegisterControllers(() => {
          // Reload locales
          if (sails.hooks.i18n) {
            sails.hooks.i18n.initialize(() => {
            });
          }
          // Reload services
          sails.hooks.services.loadModules(() => {
          });

          // Reload blueprints on controllers
          sails.hooks.blueprints.extendControllerMiddleware();

          // Flush router
          sails.router.flush();

          // Reload blueprints
          sails.hooks.blueprints.bindShadowRoutes();

          // create react-router routes
          _this._loadRoutes(sails.config[_this.configKey].routes, true);
        });
      }
    },

    /**
     * Add a route handler for the given path. This internally routes through react-router
     * and renders a route.
     * @param name
     * @param path
     * @param routingPreference
     * @private
     */
    _addRoute(name, path, routingPreference) {
      if (path !== '/*') { // ignore NotFound routes, let sails handle this.
        if (name && name.length) {
          name = name.charAt(0).toUpperCase() + name.substr(1);
        } else {
          name = 'No Name';
        }

        // use provided routingPreference from route or use the default
        if (!routingPreference) {
          routingPreference = sails.config[this.configKey].routingPreference;
        }

        sails.log.verbose(`shrr: Added new route path "${path}" (pref: ${routingPreference})`);

        if (routingPreference === 'sails') {
          this.routes.before[`GET ${path}`] = this._routerMiddleware(name, path);
        } else {
          this.routes.after[`GET ${path}`] = this._routerMiddleware(name, path);
        }
      }
    },

    /**
     * Iterates through all react-router routes and their children and binds
     * sails routes.
     * @param routeComponent
     * @param parentPath
     * @private
     */
    _iterateRouteChildren(routeComponent, parentPath) {
      if (!parentPath && routeComponent.props.path) {
        this._addRoute(
          routeComponent.props.name,
          routeComponent.props.path,
          routeComponent.props.routingPreference
        );

        // modify the parent path to to include the components path
        parentPath = parentPath ? parentPath + routeComponent.props.path :
          routeComponent.props.path;
      }

      if (routeComponent.props.children) {
        Children.forEach(routeComponent.props.children, (child) => {
          if (parentPath && !parentPath.endsWith('/')) {
            if (child.props.path && !child.props.path.startsWith('/')) {
              parentPath = `${parentPath}/`;
            }
          }

          const pathWithParent = parentPath ? parentPath + child.props.path : child.props.path;

          if (child.props.path) {
            this._addRoute(child.props.name, pathWithParent, child.props.routingPreference);
          }

          if (child.props && child.props.children) {
            this._iterateRouteChildren(child, pathWithParent);
          }
        });
      }
    },

    /**
     * TODO - Polices
     * @param name
     * @param path
     * @returns {function()}
     * @private
     */
    _routerMiddleware(name, path) {
      return (req, res) => {
        if (!req.react) {
          req.react = {
            title: '',
            state: null,
            props: {},
          };
        }
        req.react.name = name;
        req.react.path = path;
        req.reactHookConfigKey = this.configKey;
        sails.log.verbose(`shrr: _routerMiddleware request: ${req.url}`);
        return serverRouter(req, res);
      };
    },

    /**
     * Attach the custom renderReactRoute response for use in user policies and controllers.
     * @param req
     * @param res
     * @param next
     * @returns {*}
     * @private
     */
    _addRenderReactRouteMethod(req, res, next) {
      // add the default react object to req for use on renderServerRoute
      req.react = {
        title: '',
        state: null,
        props: {},
      };

      res.renderReactRoute = renderReactRouteResponse(req, res);

      next();
    },

    routes: {
      before: {},
      after: {},
    },
  };
}
