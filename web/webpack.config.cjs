const { resolve, join } = require('path');
const commonConfig = require('../common/webpack.config.cjs');

/** @type {import('webpack').Configuration[]} */
module.exports = [
  {
    ...commonConfig(__dirname, {}, 'browser', 'index'),
    devServer: {
      hot: true,
      compress: true,
      historyApiFallback: true, // For Svelte routing
      host: 'localhost',
      port: 3000,
      client: {
        overlay: {
          runtimeErrors: (error) => {
            if (error?.message === 'ResizeObserver loop completed with undelivered notifications.' || error?.message === 'ResizeObserver loop limit exceeded') {
              return false;
            }
            return true;
          },
        },
      },
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) throw new Error('webpack-dev-server is not defined');
        
        const { setupTorrentBackend } = require('./torrent-server.cjs');
        const path = require('path');
        const fs = require('fs');
        setupTorrentBackend(devServer.app);

        // Serve local extensions directory so it can be added as a source in Extension Settings
        const extensionsDir = path.resolve(__dirname, '../extensions');
        devServer.app.use('/extensions', (req, res, next) => {
          let filePath = path.join(extensionsDir, req.path);
          if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.js')) {
            filePath += '.js';
          }
          // If path resolves to a directory, serve its index.json
          if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.json');
          }
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', filePath.endsWith('.json') ? 'application/json' : 'application/javascript');
            res.sendFile(filePath);
          } else {
            next();
          }
        });

        devServer.app.use('/cors-proxy', async (req, res) => {
          // Forward to Vercel production cors-proxy so localhost mirrors production exactly
          const VERCEL_CORS_PROXY = 'https://kidzoo-nodejs.vercel.app/cors-proxy';
          const targetUrl = req.query.url;
          if (!targetUrl) return res.status(400).send('Missing url parameter');
          
          try {
            const forwardUrl = `${VERCEL_CORS_PROXY}?url=${encodeURIComponent(targetUrl)}`;
            const fetchRes = await fetch(forwardUrl, { method: req.method });
            res.status(fetchRes.status);
            fetchRes.headers.forEach((val, key) => {
              if (!['content-encoding', 'content-length', 'connection'].includes(key.toLowerCase())) {
                res.setHeader(key, val);
              }
            });
            const buffer = await fetchRes.arrayBuffer();
            res.send(Buffer.from(buffer));
          } catch(err) {
             res.status(500).send(err.message);
          }
        });
        
        return middlewares;
      }
    }
  }
];
