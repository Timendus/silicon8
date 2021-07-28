const path = require('path');

module.exports = {
  mode: 'development',

  entry: {
    'index': './web-client/index.js'
  },

  devtool: 'inline-source-map',

  output: {
		path: path.join(__dirname, 'docs'),
		filename: '[name].js'
	},

  watchOptions: {
    ignored: [
      '/node_modules/'
    ]
  },

  devServer: {
    contentBase: path.join(__dirname, 'docs')
  }
};
