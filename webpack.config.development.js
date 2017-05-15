var webpack = require('webpack');
var path = require('path')

var config = {
  target: 'electron-renderer',
  externals: [{
    'electron-config': 'electron-config'
  }],
  entry: [
    'webpack-hot-middleware/client?reload=true&path=http://localhost:9000/__webpack_hmr',
    './src/index',
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
          }
        } 
      }
    ]
  },
  output: {
    path: __dirname + '/dist',
    publicPath: 'http://localhost:9000/dist/',
    filename: 'bundle.js'
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      utils: path.resolve(__dirname, 'src', 'js', 'utils.js'),
      modals: path.resolve(__dirname, 'src', 'components', 'Modals')
    }
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  node: {
    __dirname: false,
    __filename: false
  }
};
module.exports = config;