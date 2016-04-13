# sails-hook-react-router

[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]][travis-url]
[![Dependency Status][daviddm-image]][daviddm-url]

Bring the power of [React Router](https://github.com/reactjs/react-router) to your SailsJS application. This configurable hook is designed for universal/isomorphic React applications, as the routes are handled both on the server and client.

## Installation
### NPM Install
```sh
npm install sails-hook-react-router --save
```

> This project requires React >0.14 & React Router >1.0 (`npm install react react-router --save`)

### Sails setup
Create a `react` config which at minimum returns the resolved path to your React Router exported routes, e.g:

```javascript
// config/react.js
var path = require('path');

module.exports.react = {
  
  routes: path.resolve(__dirname, './../app/routes')
  
};

```

> See below API for the full set of config options.

### React Router setup
The routes file now simply needs to return a set of React Router routes. For more information, check the [React Router documentation](https://github.com/reactjs/react-router/blob/master/docs/guides/RouteConfiguration.md). An example of this file:

```javascript
import React from 'react';
import { Route, Router, IndexRoute, browserHistory } from 'react-router';

import Layout from './layout';
import Home from './pages/home';
import Articles from './pages/articles';
import NotFound from './pages/404';

export default (
  <Router history={browserHistory}>
    <Route path="/" component={Layout}>
      <IndexRoute component={Home}  />
      <Route path="articles" component={Articles} />
      <Route path="*" component={NotFound} />
    </Route>
  </Router>
);
```

## API

| API | Description | Type |
|---|---|---|---|
| routes | A resolved path to a file which exports a Router component | string |
| reloadOnWebpackBuild | Hot reload routes, sails controllers, services etc after every webpack build (only applies in DEV environment). Requires [sails-hook-webpack](https://github.com/teamfa/sails-hook-webpack) to be installed. | boolean |
| isomorphicStyleLoader | If enabled, crtitical component styles will be rendered server side. This helps deal with [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) issue on client side applications. | boolean |
| routingPreference | Which router takes preference on route loading. If two routes on Sails and React are identical, whichever is specified here will be loaded over the other. | string (react/sails) |

## License
MIT

## Maintained By
- [Mike Diarmid](https://github.com/salakar)
- [Elliot Hesp](https://github.com/ehesp)

<img src='http://i.imgur.com/NsAdNdJ.png'>

[npm-image]: https://img.shields.io/npm/v/sails-hook-webpack.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sails-hook-webpack
[travis-image]: https://img.shields.io/travis/teamfa/sails-hook-webpack.svg?style=flat-square
[travis-url]: https://travis-ci.org/teamfa/sails-hook-webpack
[daviddm-image]: http://img.shields.io/david/teamfa/sails-hook-webpack.svg?style=flat-square
[daviddm-url]: https://david-dm.org/teamfa/sails-hook-webpack
