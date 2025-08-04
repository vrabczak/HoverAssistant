const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const { LimitChunkCountPlugin } = require('webpack').optimize;

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '',
    clean: true
  },
  mode: 'production',
  devtool: false,
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new LimitChunkCountPlugin({ maxChunks: 1 }),
    new HtmlInlineScriptPlugin(),
    // Copy PWA files
    {
      apply: (compiler) => {
        compiler.hooks.emit.tapAsync('CopyPWAFiles', (compilation, callback) => {
          const fs = require('fs');

          // Copy manifest.json
          try {
            const manifestContent = fs.readFileSync('./src/manifest.json', 'utf8');
            compilation.assets['manifest.json'] = {
              source: () => manifestContent,
              size: () => manifestContent.length
            };
          } catch (error) {
            console.warn('Could not copy manifest.json:', error.message);
          }

          // Copy service worker
          try {
            const swContent = fs.readFileSync('./src/sw.js', 'utf8');
            compilation.assets['sw.js'] = {
              source: () => swContent,
              size: () => swContent.length
            };
          } catch (error) {
            console.warn('Could not copy sw.js:', error.message);
          }

          callback();
        });
      }
    }
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  optimization: {
    splitChunks: false,
    runtimeChunk: false
  },
  target: ['web']
};
