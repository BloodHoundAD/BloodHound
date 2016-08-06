var webpack = require('webpack');
var webpackTargetElectronRenderer = require('webpack-target-electron-renderer');
var path = require('path')

var config = {
  entry: [
    'webpack-hot-middleware/client?reload=true&path=http://localhost:9000/__webpack_hmr',
    './src/index',
  ],
  module: {
    loaders: [{test: /\.jsx?$/,loaders: ['babel-loader'], exclude: /node_modules/
    }]
  },
  output: {
    path: __dirname + '/dist',
    publicPath: 'http://localhost:9000/dist/',
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    alias: {
      utils: path.resolve(__dirname, 'src', 'js', 'utils.js'),
      modals: path.resolve(__dirname, 'src', 'components', 'Modals')
    }
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  node: {
    __dirname: true
  }
};

config.target = webpackTargetElectronRenderer(config);

module.exports = config;