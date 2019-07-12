const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WebpackAutoInject = require('webpack-auto-inject-version');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const webpack = require('webpack');

const packageJson = require('./package.json');

const mode = process.env.NODE_ENV || 'production';

const appVersionSuffix = packageJson.version.replace(/\./g, '-');
const cssJsMinSuffix = mode === 'production' ? '.min' : '';

const sourcePath = path.resolve(__dirname, 'src');
const sourceClientPath = path.resolve(sourcePath, 'client');
const distPath = path.resolve(__dirname, 'dist');
const clientDistPath = path.resolve(distPath, 'client');

const entryPoints = [
  // Main App
  {
    name: 'main',
  },
  // Main Scoreboard Display
  {
    name: 'emulator',
  },
];

const hotMiddlewareScript = 'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=5000&reload=true';

const entry = (() => {
  const result = {};

  entryPoints.forEach((entryPoint) => {
    result[entryPoint.name] = [
      path.resolve(sourceClientPath, 'apps', entryPoint.name, `${entryPoint.name}.js`),
      hotMiddlewareScript,
    ];
  });
  return result;
})();

module.exports = {
  mode,
  context: __dirname,
  resolve: {
    extensions: [
      '.js',
      '.jsx',
    ],
  },
  entry,
  output: {
    path: clientDistPath,
    publicPath: '/',
    filename: 'js/[name].js',
  },
  devtool: 'source-map',
  module: {
    rules: [{
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
      },
    }, {
      test: /\.(scss|css)$/,
      use: [
        'css-hot-loader',
        {
          loader: MiniCssExtractPlugin.loader,
          options: {
            publicPath: '../',
          },
        },
        {
          loader: 'css-loader',
          options: {
            sourceMap: true,
          },
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
          },
        },
      ],
    }],
  },
  plugins: [
    // Clean up our dist folder
    new CleanWebpackPlugin({
      // this is a very unsafe option, be careful when using
      // could potentially clean outside the dist folder
      cleanOnceBeforeBuildPatterns: [
        '**/*',
        distPath,
      ],
    }),

    // Upgrade the version number on every build
    new WebpackAutoInject({
      components: {
        AutoIncreaseVersion: true, // Auto increment the version
      },
      componentsOptions: {
        AutoIncreaseVersion: {
          runInWatchMode: true, // it will increase version with every single build!
        },
      },
    }),

    // Use HTML Webpack Plugin to copy and populate our html templates
    // @TODO: Move the meta tags out of each of the individual HTML pages
    // @TODO: Pass app title into the html templates
    ...entryPoints.map(entryPoint => new HtmlWebpackPlugin({
      filename: path.resolve(clientDistPath, `${entryPoint.name}.html`),
      chunks: [entryPoint.name],
      hash: true,
      templateParameters: {
        appVerSuffix: appVersionSuffix,
        cssJsMinSuffix,
      },
      template: path.resolve(sourceClientPath, 'apps', entryPoint.name, `${entryPoint.name}.html`),
      alwaysWriteToDisk: true,
    })),

    // Extract the compiled CSS for each entry point into an external file
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
    }),

    // Copy other static assets to our dist folder
    new CopyWebpackPlugin([{
      from: path.resolve(sourceClientPath, 'public'),
      to: clientDistPath,
    }]),

    // TODO: Conditionally include this in dev builds only
    new webpack.HotModuleReplacementPlugin(),

    new HtmlWebpackHarddiskPlugin(),
  ],

  // Webpack Development Server
  // TODO: conditionally include this config for dev builds only
  devServer: {
    contentBase: distPath,
    watchContentBase: true,
  },
};
