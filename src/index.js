import React, {Children} from 'react';
import serverRouter from './router/server';
import renderReactRouteResponse from './responses/renderReactRoute';
import defaultConfig from './webpack/default.config';

export default function (sails) {

	if (!sails.config.react || !sails.config.react.routes) {
		sails.log.warn('Sails React: No routes config was provided at sails.config.react.routes, ' +
			'import your routes in the config file.');
		return {};
	}
  
  // TODO
	// if (!sails.config.webpack || !sails.config.webpack.config) {
	// 	sails.log.warn('Sails React: sails-hook-react requires the hook sails-hook-webpack, ' +
	// 		'please install this hook and configure your webpack options.');
	// 	return {};
	// }

	return {

		__routesRequired: {},

		sailsLifted: false,

		configure() {
			const defaults = defaultConfig(sails);
			if (process.env.NODE_ENV === 'development') {
				require('./webpack/development.config')(sails, defaults);
			} else {
        require('./webpack/production.config')(sails, defaults);
      }
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
			sails.after('hook:sails-hook-webpack:compiler-ready', () => {
				try {
					this.__routesRequired = require(sails.config.react.routes);
					this.iterateRouteChildren(this.__routesRequired);
				} catch (e) {
				}
				if (sails.config.webpack && sails.config.webpack.config) {
					sails.on('hook:sails-hook-webpack:after-build', this.onWebpackUpdate);
				}
			});
		},

		/**
		 *
		 * @param stats
		 */
		onWebpackUpdate: function (stats) {
			const _this = this;

			sails.log.verbose("Detected webpack change -- reloading sails routes and react components.");
			try {
				// clear require cache
				delete require.cache[require.resolve(sails.config.react.routes)];
				// reload react routes
				this.__routesRequired = require(sails.config.react.routes);
			} catch (e) {
				return;
			}

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
		 * TODO
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
