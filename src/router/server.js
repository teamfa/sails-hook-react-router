import React from 'react';
import { sailsReactRouter } from './';
import { renderToString } from 'react-dom/server';
import createLocation from 'history/lib/createLocation';
import createMemoryHistory from 'history/lib/createMemoryHistory';
import WithStylesContext from './../components/WithStylesContext';

/**
 * Serve a rendered route to a client request - uses req.url.
 * @param req
 * @param res
 */
export default function (req, res) {
  if (__SERVER__) {
    // for responses / middleware
    if (!req) {
      req = this.req;
    }

    // for responses / middleware
    if (!res) {
      res = this.res;
    }

    const history = createMemoryHistory();
    const location = createLocation(req.url);

    sailsReactRouter(sails.hooks.reactRouter.__routesRequired, location, history, req, res)
      .then((reactElement) => {
        try {
          const css = [];
          const reactStr = renderToString(
            <WithStylesContext onInsertCss={styles => css.push(styles._getCss())}>
              {reactElement}
            </WithStylesContext>
          );

          if (!req.react.title) {
            req.react.title = req.react.name;
          }

          if (req.react.state) {
            delete req.react.state.components;
            delete req.react.state.router;
            delete req.react.state.matchContext;
            delete req.react.state.history;
            req.react.state = JSON.stringify(req.react.state);
          }

          if (css.length) {
            req.react.inlineStyles = css.join('');
          }

          return res.view('layout', {
            locals: {
              react: req.react,
            },
            body: reactStr,
          });
        } catch (err) {
          return res.serverError(err);
        }
      })
      .catch((err) => {
        sails.log.error(err);
        return res.serverError(err);
      });
  }
}
