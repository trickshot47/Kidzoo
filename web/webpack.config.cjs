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
          const targetUrl = req.query.url;
          if (!targetUrl) return res.status(400).send('Missing url parameter');
          
          try {
            const fetchReq = new Request(targetUrl, {
              method: req.method,
              headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
              },
            });
            const fetchRes = await fetch(fetchReq);
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
