import extend from 'extend';
import {resolve, join} from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import AssetsPlugin from 'assets-webpack-plugin';
import LinkerPlugin from 'linker-webpack-plugin';

const DEBUG = process.argv && !process.argv.includes('--release');
const VERBOSE = process.argv && process.argv.includes('--verbose');

const GLOBALS = {
  'process.env.NODE_ENV': process.env.NODE_ENV,
  __DEV__: process.env.NODE_ENV === 'development',
  __DEBUG__: process.env.NODE_ENV === 'development',
  __SERVER__: false,
  __CLIENT__: false
};

export default function (sails, defaultConfig) {
  const port = sails.config.react.webpackDevServerPort || 3000;

  const srcPathPrefix = sails.config.react.srcRootDirectory ?
    `${sails.config.react.srcRootDirectory}/` :
    './';

  const buildPathPrefix = sails.config.react.srcRootDirectory ?
    `${sails.config.react.buildRootDirectory}/` :
    './';

  const client = extend(true, {}, defaultConfig, {
    entry: [
      `webpack-dev-server/client?http://0.0.0.0:${port}`, // WebpackDevServer host and port
      'webpack/hot/only-dev-server', // "only" prevents reload on syntax errors
      resolve(sails.config.appPath, `${srcPathPrefix}assets/js/app`)
    ],

    output: {
      path: resolve(sails.config.appPath, `${buildPathPrefix}.tmp/public/js`),
      filename: 'bundle-[hash].js',
      publicPath: `http://localhost:${port}/`
    },

    // Choose a developer tool to enhance debugging
    // http://webpack.github.io/docs/configuration.html#devtool
    devtool: DEBUG ? 'cheap-module-eval-source-map' : false,

    target: 'web',

    node: {
      // console: 'empty',
      fs: 'empty',
      net: 'empty',
      tls: 'empty'
    },

    browser: {
      net: false,
      tls: false,
      'sails-hook-webpack': false
    },

    plugins: [
      ...defaultConfig.plugins,
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoErrorsPlugin(),
      new webpack.DefinePlugin({...GLOBALS, __CLIENT__: true, __SERVER__: false}),
      // assets list into sails config so we can access them in sails
      new AssetsPlugin({
        path: resolve(sails.config.appPath, `${buildPathPrefix}config`),
        filename: 'assets.js',
        processOutput: x => `module.exports.assets = ${JSON.stringify(x)};`
      }),

      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          screw_ie8: true,
          warnings: VERBOSE
        }
      }),
      new webpack.optimize.AggressiveMergingPlugin(),

      new LinkerPlugin({
        entry: './src/views/layout.ejs',
        hash: '[hash]',
        output: './build/views/layout.ejs',
        data: {
          css: '',
          templates: '',
          scripts: `<script src="//localhost:${port}/bundle-[hash].js"></script>`
        }
      })
    ]
  });

  const server = extend(true, {}, defaultConfig, {
    entry: resolve(sails.config.appPath, `${srcPathPrefix}assets/js/routes`),

    output: {
      path: resolve(sails.config.appPath, `${buildPathPrefix}assets/js`),
      publicPath: `http://localhost:${port}/`,
      filename: 'routes.js',
      libraryTarget: 'commonjs2'
    },

    target: 'async-node',

    externals: [nodeExternals()],

    node: {
      net: false,
      tls: false,
      console: false,
      global: false,
      process: false,
      Buffer: false,
      __filename: false,
      __dirname: false
    },

    devtool: DEBUG ? 'cheap-module-eval-source-map' : false,

    plugins: [
      ...defaultConfig.plugins,
      new webpack.DefinePlugin({...GLOBALS, __CLIENT__: false, __SERVER__: true}),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          screw_ie8: true,
          warnings: VERBOSE
        }
      }),
      new webpack.optimize.AggressiveMergingPlugin()
    ]
  });

  server.module.loaders.shift();

  sails.config.webpack = {

    // webpack config here
    config: server,

    // dev server config
    development: {

      // separate config for dev server, otherwise it'll default to the config above
      webpack: client,

      // webpack-dev-server-config
      config: {
        port: 3000
      }
    },
    // webpack watch options
    watchOptions: {
      aggregateTimeout: 300
    }
  };

  sails.emit('hook:react:webpack-configured', sails.config.webpack);
}




