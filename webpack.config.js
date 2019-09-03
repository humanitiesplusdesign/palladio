const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: "./src/entrypoint.js",
  output: {
    filename: "palladio.js",
    path: path.resolve(__dirname, "dist/")
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      { test: /\.(png|jpg)$/, loader: "file-loader" },
      { test: /\.html$/, use: [{ loader: "ngtemplate-loader?relativeTo=components/" }, { loader: "html-loader" }] }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      d3: "d3"
      // $: "jquery",
      // jQuery: "jquery",
      // "window.jQuery": "jquery",
      // "window.$": "jquery"
    }),
    new MiniCssExtractPlugin({ filename: "palladio.css" })
  ]
};
