const path = require("path");
const webpack = require("webpack");

const TerserJSPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

function getConfig(minified) {
  return {
    mode: minified ? "production" : "development",
    entry: "./src/entrypoint.js",
    output: {
      filename: minified ? "palladio.min.js" : "palladio.js",
      path: path.resolve(__dirname, "dist/")
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [MiniCssExtractPlugin.loader, "css-loader"]
        },
        { test: /\.(png|jpg)$/, loader: "file-loader" },
        { test: /\.html$/, use: [{ loader: "ngtemplate-loader?relativeTo=components/" }, { loader: "html-loader" }] },
        {
          test: /.(ttf|otf|eot|svg|woff(2)?)(\?[a-z0-9]+)?$/,
          use: [
            {
              loader: "file-loader",
              options: {
                name: "[name].[ext]",
                outputPath: "fonts/", // where the fonts will go
                publicPath: "fonts/", // override the default path
                useRelativePath: true
              }
            }
          ]
        }
      ]
    },
    optimization: {
      minimizer: minified ? [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})] : []
    },
    plugins: [
      new webpack.ProvidePlugin({
        d3: "d3"
        // $: "jquery",
        // jQuery: "jquery",
        // "window.jQuery": "jquery",
        // "window.$": "jquery"
      }),
      new MiniCssExtractPlugin({ filename: minified ? "palladio.min.css" : "palladio.css" })
    ]
  };
}

module.exports = () => {
  switch (process.env.NODE_ENV) {
    case "production":
      return [getConfig(false), getConfig(true)];
    default:
      return getConfig(false);
  }
};
