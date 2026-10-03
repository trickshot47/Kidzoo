const { join, resolve } = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const nodeEnv = process.env.NODE_ENV?.trim()
const mode = nodeEnv === 'production' || nodeEnv === 'none' ? nodeEnv : 'development'
const isDev = mode === 'development'

/** @type {(parentDir: string, alias?: Record<string, string | false>, aliasFields?: string, filename?: string) => import('webpack').Configuration} */
module.exports = (parentDir, alias = {}, aliasFields = 'browser', filename = 'app') => ({
  devtool: 'source-map',
  experiments: {
    css: true
  },
  entry: [join(__dirname, 'main.js')],
  stats: { warnings: false },
  output: {
    path: join(parentDir, 'build'),
    filename: 'renderer.js'
  },
  resolveLoader: {
    modules: [
      'node_modules',
      resolve(__dirname, '../node_modules'),
      resolve(__dirname, 'node_modules')
    ]
  },
  mode,
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: {
          loader: 'svelte-loader',
          options: {
            compilerOptions: {
              dev: isDev
            },
            emitCss: !isDev,
            hotReload: isDev
          }
        }
      },
      {
        // required to prevent errors from Svelte on Webpack 5+
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
          fullySpecified: false
        }
      },
      {
        // required to prevent strict ESM extension errors from capacitor-nodejs
        test: /\.js$/,
        include: /capacitor-nodejs/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  },
  resolve: {
    mainFields: ['svelte', 'browser', '...'],
    conditionNames: ['svelte', 'browser', '...'],
    modules: [
      'node_modules',
      resolve(__dirname, '../node_modules'),
      resolve(__dirname, '../client/node_modules'),
      resolve(__dirname, '../capacitor/node_modules'),
      resolve(__dirname, 'node_modules')
    ],
    aliasFields: [aliasFields],
    alias: {
      ...alias,
      '@': __dirname,
      module: false,
      url: false,
      debug: resolve(__dirname, './modules/lib/debug.js'),
      'bittorrent-tracker/lib/client/websocket-tracker.js': resolve(__dirname, '../client/node_modules/bittorrent-tracker/lib/client/websocket-tracker.js')
    },
    extensions: ['.mjs', '.js', '.svelte']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: join(__dirname, 'public') },
        { from: resolve(__dirname, '../extensions/index.json'), to: 'extensions/index.json' },
        { from: resolve(__dirname, '../extensions/sources'), to: 'extensions/sources' }
      ]
    }),
    new HtmlWebpackPlugin({
      filename: filename + '.html',
      inject: false,
      templateContent: ({ htmlWebpackPlugin }) => /* html */`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset='utf-8'>
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#17191C">
<meta name="darkreader-lock">
<meta name="color-scheme" content="dark">
<meta name="google-site-verification" content="weiEFsSVPHwEqmJui6IpP0tEnzyNEgo1wDs_53DY_ho" />

<!-- SEO Meta Tags -->
<title>KidZoo - Watch Free Anime Online</title>
<meta name="description" content="KidZoo is a blazing fast, free anime streaming platform. Watch your favorite subbed and dubbed anime in high quality without any ads.">
<meta name="keywords" content="anime, watch anime online, free anime, subbed anime, dubbed anime, streaming, KidZoo">
<meta name="author" content="KidZoo">
<meta name="robots" content="index, follow">

<!-- Open Graph / Social Media Previews -->
<meta property="og:title" content="KidZoo - Watch Free Anime Online">
<meta property="og:description" content="Watch your favorite subbed and dubbed anime in high quality without any ads on KidZoo.">
<meta property="og:type" content="website">
<meta property="og:url" content="https://kidzoo-nodejs.vercel.app/">
<meta property="og:image" content="https://kidzoo-nodejs.vercel.app/icon_filled.png">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="KidZoo - Watch Free Anime Online">
<meta name="twitter:description" content="Watch your favorite subbed and dubbed anime in high quality without any ads on KidZoo.">
<meta name="twitter:image" content="https://kidzoo-nodejs.vercel.app/icon_filled.png">

<link rel="preconnect" href="https://i.ytimg.com">
<link rel="preconnect" href="https://www.youtube-nocookie.com">
<link rel="preconnect" href="https://s4.anilist.co/">
<link rel="preconnect" href="https://graphql.anilist.co/">
<link rel="preconnect" href="https://cdn.myanimelist.net/">
<link rel='icon' href='/icon_filled.png' type="image/png">
${htmlWebpackPlugin.tags.headTags}
</head>

<body class="dark-mode with-custom-webkit-scrollbars">
${htmlWebpackPlugin.tags.bodyTags}
</body>

</html> `
    })],
  target: 'web'
})