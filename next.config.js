require('@babel/polyfill');
const webpack = require('webpack');
const dotenv = require('dotenv');
const StringReplacePlugin = require('string-replace-webpack-plugin');
const WebpackAutoInject = require('webpack-auto-inject-version');
const withBundleAnalyzer = require('@zeit/next-bundle-analyzer');
const minify = require('harp-minify');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const Buildify = require('buildify');
const path = require('path');
const getBuildID = require('../config/build/get-build-id');

const {
  ENV_DEVELOPMENT,
  STATIC_FOLDER_PREFIX,
  ENV_PRODUCTION,
} = require('../isomorphic/constants');

/* eslint-disable */
const nextBuildId = getBuildID();
/* eslint-enable */

const { parsed: envVars } = dotenv.config({
  path: path.resolve(
    __dirname,
    `..${path.sep}app${path.sep}env${path.sep}${process.env.BUILD_ENV || ENV_DEVELOPMENT}.env`,
  ),
});

const getRegExp = () => {
  const regex = `${STATIC_FOLDER_PREFIX}`;
  return new RegExp(regex, 'ig');
};
const metricsKey = process.env.ENV_API_KEY === process.env.PROD_KEY ? 'prod' : 'dev';

module.exports = withBundleAnalyzer({
  poweredByHeader: false,
  assetPrefix:
    process.env.NODE_ENV === ENV_PRODUCTION && process.env.CDN_ENABLE === 'true'
      ? process.env.CDN_URL
      : '',
  crossOrigin: 'anonymous',
  // eslint-disable-next-line
  webpack: (config, { dev, buildId, isServer }) => {
    config.plugins.push(new webpack.EnvironmentPlugin(envVars));

    config.module.rules.push(
      {
        exclude: /node_modules/,
        test: /\.css$/,
        use: ['babel-loader', 'raw-loader'],
      },
      {
        exclude: /node_modules\/react-flags-select\/flags\/.*\.svg$/,
        test: /\.(jpe?g|png|gif|svg|xml)$/i,
        use: ['url-loader'],
      },
      {
        test: /node_modules\/react-flags-select\/flags\/.*\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options:
              process.env.NODE_ENV === ENV_PRODUCTION
                ? {
                  name: 'dist/static/images/country-images/[name].[ext]',
                  publicPath: url => url.replace(/dist\/static/, `/static/${nextBuildId}`),
                }
                : { name: 'countries-images/[name].[ext]' },
          },
        ],
      },
    );

    const originalEntry = config.entry;
    config.entry = async () => {
      const entries = await originalEntry();
      if (entries['main.js']) {
        entries['main.js'].unshift('babel-polyfill');
      }
      return entries;
    };

    if (process.env.NODE_ENV === ENV_PRODUCTION) {
      if (isServer) {
        const foundation = {
          destPath: '/app/.next/dist/static/styles/vendor/',
          files: [
            './app/static/styles/vendor/normalize.css',
            './app/static/styles/vendor/nprogress.css',
            './app/static/styles/vendor/progressBar.css',
            './app/static/styles/vendor/video-js.css',
            './app/static/styles/fonts/baskerville.css',
            './app/static/styles/icons/icons.css',
          ],
          fileName: 'foundation',
        };

        Buildify()
          .concat(foundation.files.concat('./app/static/styles/vendor/flexboxgrid.css'))
          .cssmin()
          .save(`${foundation.destPath}${foundation.fileName}.css`);
      }
      config.plugins.push(new StringReplacePlugin());
      config.plugins.push(new CopyWebpackPlugin(
        [
          {
            from: path.join(__dirname, '/static/**/*'),
            to: path.join(__dirname, '/.next/dist'),
            transform(content, filePath) {
              if (filePath.endsWith('.css')) {
                return minify.css(content.toString());
              } else if (filePath.endsWith('.js') && filePath.indexOf('polyfills') === -1) {
                /* exclude any file that has es6 code as the plugin cannot uglifiy it
               ref:https://github.com/webpack-contrib/uglifyjs-webpack-plugin/issues/7 */
                try {
                  return minify.js(content.toString());
                } catch (err) {
                  console.log(err);
                }
              }
              return content;
            },
          },
        ],
        {},
      ));

      // add build id before static resources for cache busting
      config.module.rules.push({
        test: [/\.css$/, /\.js$/],
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: getRegExp(),
              replacement(match) {
                return `${match}${nextBuildId}/`;
              },
            },
          ],
        }),
      });
    }

    // Following check is for prod builds and client only
    if (!dev && !isServer) {
      /* eslint no-param-reassign:0 */
      config.resolve = {
        alias: {
          winston: path.resolve(__dirname, 'lib/fake/winston.js'),
          'winston-logrotate': path.resolve(__dirname, 'lib/fake/winston.js'),
          'memory-cache': path.resolve(__dirname, 'lib/fake/memory-cache.js'),
        },
      };

      config.plugins.push(new WebpackAutoInject({
        SHORT: 'Bang & olufsen',
        PACKAGE_JSON_PATH: './package.json',
        components: {
          InjectAsComment: {
            tag: 'Build version: {version} - {date}',
            dateFormat: 'dddd, mmmm dS, yyyy, h:MM:ss TT',
          },
        },
      }));
    }

    config.resolve.alias.fs = path.resolve(__dirname, 'lib/fake/fs.js');

    return config;
  },
  publicRuntimeConfig: {
    metricsKey,
    isCachingEnabled: process.env.CACHE_ENABLED !== 'false',
    isProd: process.env.PROD_ENV === 'true',
  },
  analyzeServer: process.env.BUNDLE_ANALYZE,
  analyzeBrowser: process.env.BUNDLE_ANALYZE,
  bundleAnalyzerConfig: {
    server: {
      analyzerMode: 'static',
      reportFilename: '../../../reports/bundle-analyze/server.html',
    },
    browser: {
      analyzerMode: 'static',
      reportFilename: '../../reports/bundle-analyze/client.html',
    },
  },
});
