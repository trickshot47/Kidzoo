const { WebSocketServer } = require('ws');
const path = require('path');
const fs = require('fs');

let client = null;
import('webtorrent').then(({ default: WebTorrent }) => {
    client = new WebTorrent();
});
let wss = null;

function setupTorrentBackend(app) {
  // HTTP stream for video player
  app.get('/api/torrent/stream/:hash/:index', async (req, res) => {
    if (!client) return res.status(503).send('Not ready');
    const torrent = await client.get(req.params.hash);
    if (!torrent) return res.status(404).send('Torrent not found');
    const file = torrent.files[parseInt(req.params.index, 10)];
    if (!file) return res.status(404).send('File not found');

    const range = req.headers.range;
    if (!range) {
        res.writeHead(200, {
            'Content-Length': file.length,
            'Content-Type': 'video/mp4'
        });
        file.createReadStream().pipe(res);
        return;
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
    const chunksize = (end - start) + 1;

    res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${file.length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4'
    });

    const stream = file.createReadStream({ start, end });
    stream.on('error', (err) => {
        // Ignore premature close errors when client disconnects
        if (err.code === 'PREMATURE_CLOSE' || err.code === 'ERR_STREAM_PREMATURE_CLOSE') return;
        console.error('Stream error:', err);
    });
    
    // Also handle client disconnects explicitly
    req.on('close', () => {
        if (!stream.destroyed) stream.destroy();
    });

    stream.pipe(res);
  });

  // Setup WebSocket server
  if (!wss) {
    wss = new WebSocketServer({ port: 3001 });
    
    wss.on('connection', (ws) => {
      const send = (channel, args) => ws.send(JSON.stringify({ channel, args }));
      
      ws.on('message', async (msg) => {
        const { channel, args } = JSON.parse(msg);
        
        if (channel === 'stream') {
          if (!client) {
            console.error('WebTorrent client not loaded yet');
            return;
          }
          const [torrentID, hash, magnet] = args;
          
          let t = await client.get(magnet) || await client.get(torrentID) || await client.get(hash);
          if (!t) {
              t = client.add(magnet || hash || torrentID, { path: path.join(process.cwd(), 'temp-downloads') });
          }
          
          const onReady = () => {
              const files = t.files.map((f, i) => ({
                  name: f.name,
                  url: `http://localhost:3000/api/torrent/stream/${t.infoHash}/${i}`,
                  length: f.length
              }));
              send('onFiles', [files]);
              
              // Find first video file
              const videoFileIndex = t.files.findIndex(f => f.name.endsWith('.mp4') || f.name.endsWith('.mkv'));
              const current = videoFileIndex !== -1 ? files[videoFileIndex] : files[0];
              
              send('onLoaded', [{ current }]);
          };
          
          if (t.ready) onReady();
          else t.on('ready', onReady);
          
          t.on('download', () => {
              const stats = {
                  downloadSpeed: t.downloadSpeed,
                  uploadSpeed: t.uploadSpeed,
                  numPeers: t.numPeers,
                  progress: t.progress
              };
              
              const detail = {
                  storage: { total: 0, free: 0 },
                  current: stats,
                  staging: [],
                  seeding: []
              };
              
              send('onStats', [detail]);
              send('onCurrentStats', [stats]);
          });
        }
      });
    });
  }
}

module.exports = { setupTorrentBackend };
