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

> See below config API for the full set of options.

### React Router setup
The routes file now simply needs to return a set of React Router routes. For more information, check the [React Router documentation](https://github.com/reactjs/react-router/blob/master/docs/guides/RouteConfiguration.md). An example of this file:

```javascript
// app/routes.js
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

You now need to call the hooks `clientRouter` within your JavaScripts entry point to bootstrap the routes:

```javascript
// app/index.js
import routes from './routes';
import clientRouter from 'sails-hook-react-router/lib/router/client';


clientRouter(
  routes, 
  {}, // additional props to pass to router
  // options - see clientRouter docs
  {
    reactRootElementId: 'react-root',
    isomorphicStyleLoader: true
  }
);
```

## API
### Config API
| API | Description | Type | Default |
|---|---|---|---|
| routes | A resolved path to a file which exports a Router component | string |  |
| reloadOnWebpackBuild | Hot reload routes, sails controllers, services etc after every webpack build (only applies in DEV environment). Requires [sails-hook-webpack](https://github.com/teamfa/sails-hook-webpack) to be installed. | boolean | true |
| isomorphicStyleLoader | If enabled, crtitical component styles will be rendered server side. This helps deal with [FOUC](https://en.wikipedia.org/wiki/Flash_of_unstyled_content) issue on client side applications. | boolean | true |
| routingPreference | Which router takes preference on route loading. If two routes on Sails and React are identical, whichever is specified here will be loaded over the other. | string (react/sails) | react |

### clientRouter API
| API | Description | Type | Default |
|---|---|---|---|
| reactRootElementId | The page DOM element **ID** which the app will be rendered to. | string | react-root |
| isomorphicStyleLoader | If enabled, components will be rendered with [style loader](https://github.com/kriasoft/isomorphic-style-loader). | boolean | true |

> **The `isomorphicStyleLoader` must be the same value on both the Sails config and clientRouter - otherwise you'll experience a React invalid checksum warning.**

## License
MIT

## Maintained By
- [Mike Diarmid](https://github.com/salakar)
- [Elliot Hesp](https://github.com/ehesp)

<img src='http://i.imgur.com/NsAdNdJ.png'>

[npm-image]: https://img.shields.io/npm/v/sails-hook-react-router.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sails-hook-react-router
[travis-image]: https://img.shields.io/travis/teamfa/sails-hook-react-router.svg?style=flat-square
[travis-url]: https://travis-ci.org/teamfa/sails-hook-react-router
[daviddm-image]: http://img.shields.io/david/teamfa/sails-hook-react-router.svg?style=flat-square
[daviddm-url]: https://david-dm.org/teamfa/sails-hook-react-router
