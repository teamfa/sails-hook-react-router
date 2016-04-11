const GLOBALS = {
  'process.env.NODE_ENV': process.env.NODE_ENV,
  __DEV__: process.env.NODE_ENV === 'development',
  __DEBUG__: process.env.NODE_ENV === 'development',
  __SERVER__: false,
  __CLIENT__: false
};


export default function (sails) {
  // todo
  sails.emit('hook:react:webpack-configured', {});
}
