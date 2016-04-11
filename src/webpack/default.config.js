import webpack from 'webpack';
import {resolve} from 'path';

const DEBUG = process.argv && !process.argv.includes('--release');
const VERBOSE = process.argv && process.argv.includes('--verbose');

const AUTOPREFIXER_BROWSERS = [
  'Android 2.3',
  'Android >= 4',
  'Chrome >= 35',
  'Firefox >= 31',
  'Explorer >= 9',
  'iOS >= 7',
  'Opera >= 12',
  'Safari >= 7.1'
];

export default function (sails) {

  const pathPrefix = sails.config.react.srcRootDirectory ?
    `${sails.config.react.srcRootDirectory}/` :
    './';

  return {

    output: {
      publicPath: '/',
      sourcePrefix: '  '
    },

    //cache: DEBUG,
    debug: DEBUG,

    stats: {
      colors: true,
      reasons: DEBUG,
      hash: VERBOSE,
      version: VERBOSE,
      timings: true,
      chunks: VERBOSE,
      chunkModules: VERBOSE,
      cached: VERBOSE,
      cachedAssets: VERBOSE
    },

    plugins: [
      new webpack.optimize.OccurenceOrderPlugin()
    ],

    resolve: {
      extensions: ['', '.webpack.js', '.web.js', '.js', '.jsx', '.json', '.scss', '.css'],
      root: [
        resolve(sails.config.appPath, `${pathPrefix}assets`)
      ],
      alias: sails.config.react.isomorphic ? {
        withStyles: 'isomorphic-style-loader/lib/withStyles'
      } : null
    },

    module: {
      loaders: [
        {
          test: /\.jsx?$/,
          exclude: /(node_modules|bower_components|sails-hook-react)/,
          loaders: ['react-hot'],
          include: resolve(sails.config.appPath, `${pathPrefix}assets/js/`)
        },
        {
          test: /\.jsx?$/,
          exclude: /(node_modules|bower_components|sails-hook-react)/,
          loader: 'babel',
          query: {
            presets: [
              "es2015",
              "stage-0",
              "react"
            ],
            plugins: [
              "syntax-export-extensions",
              "transform-export-extensions",
              "add-module-exports"
            ],
            ignore: [
              'assets/js/dependencies',
              'sails-hook-react/node_modules'

            ]
          }
        },
        {
          test: /\.s?css$/,
          loaders: [
            ...(sails.config.react.isomorphic ? [
              'isomorphic-style-loader'
            ] : []),
            // CSS Nano http://cssnano.co/options/
            `css-loader?${JSON.stringify({
              sourceMap: DEBUG,
              // CSS Modules https://github.com/css-modules/css-modules
              modules: true,
              localIdentName: DEBUG ? '[name]_[local]_[hash:base64:3]' : '[hash:base64:4]',
              minimize: !DEBUG
            })}`,
            'postcss-loader?parser=postcss-scss',
            'sass-loader?sourceMap'
          ]
        }, {
          test: /\.json$/,
          loader: 'json-loader'
        }, {
          test: /\.txt$/,
          loader: 'raw-loader'
        }, {
          test: /\.(png|jpg|jpeg|gif|svg|woff|woff2)$/,
          loader: 'url-loader?limit=10000'
        }, {
          test: /\.(eot|ttf|wav|mp3)$/,
          loader: 'file-loader'
        }
      ]
    },

    postcss: function plugins(bundler) {
      return [
        require('postcss-import')({addDependencyTo: bundler}),
        require('precss')(),
        require('autoprefixer')({browsers: AUTOPREFIXER_BROWSERS})
      ];
    }
  };

}

