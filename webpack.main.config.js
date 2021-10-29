const rules = require('./webpack.rules');
const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  entry: './src/main/index.ts',
  // Put your normal webpack config below here
  module: {
    rules: rules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json', '.sass'],
    alias: {
      data: path.resolve(__dirname, 'src/data/'),
    }
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'third_party/material_icons/*',
          to: path.resolve(__dirname, '.webpack')
        }
      ]
    })
  ]
};