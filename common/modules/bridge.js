const noopVoid = () => {}
const noopAsyncVoid = async () => {}
const noopAsyncBool = async () => false
const noopAsyncString = async () => ''
const torrentDefaults = {
  reload: noopVoid,
  onCrash: noopVoid,
  onRequest: noopVoid,
  debug: noopVoid,
  rescan: async () => ({ missingCount: 0, removedCount: 0 }),
  scrape: noopAsyncVoid,
  stream: noopVoid,
  stage: noopVoid,
  complete: noopVoid,
  unload: noopVoid,
  untrack: noopVoid,
  reannounce: noopVoid,
  onStats: noopVoid,
  onFiles: noopVoid,
  onMagnet: noopVoid,
  onTracks: noopVoid,
  offTracks: noopVoid,
  onSubtitles: noopVoid,
  offSubtitles: noopVoid,
  onChapters: noopVoid,
  offChapters: noopVoid,
  onProgress: noopVoid,
  onCurrentStats: noopVoid,
  onExternalReady: noopVoid,
  onExternalWatched: noopVoid,
  onAndroidExternal: noopVoid,
  onLoaded: noopVoid,
  onUntrack: noopVoid,
  onStage: noopVoid,
  onSeed: noopVoid,
  onComplete: noopVoid,
  onCompletedStats: noopVoid,
  setPlayback: noopVoid,
  restoreSession: noopVoid,
  launchExternal: noopVoid,
  updateNetwork: noopVoid,
  updateSettings: noopVoid,
  onNotify: noopVoid,
  portRequest: noopAsyncVoid
}

const isBrowser = !navigator.userAgent.toLowerCase().includes('electron') && !navigator.userAgent.toLowerCase().includes('android')

if (isBrowser) {
    const ws = new WebSocket('ws://localhost:3001');
    const callbacks = {};
    
    ws.onmessage = (event) => {
        const { channel, args } = JSON.parse(event.data);
        if (callbacks[channel]) {
            callbacks[channel].forEach(cb => cb(...args));
        }
    };
    
    const on = (channel, cb) => {
        if (!callbacks[channel]) callbacks[channel] = [];
        callbacks[channel].push(cb);
    };
    
    Object.assign(torrentDefaults, {
        stream: (torrentID, hash, magnet) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ channel: 'stream', args: [torrentID, hash, magnet] }));
            } else {
                ws.addEventListener('open', () => ws.send(JSON.stringify({ channel: 'stream', args: [torrentID, hash, magnet] })));
            }
        },
        onFiles: (cb) => on('onFiles', cb),
        onLoaded: (cb) => on('onLoaded', cb),
        onStats: (cb) => on('onStats', cb),
        onCurrentStats: (cb) => on('onCurrentStats', cb)
    });
}
const commonDefaults = {
  getAppVersion: noopAsyncString,
  getPlatformInfo: () => ({ platform: '', arch: '', flatpak: undefined, session: '', development: false, manualInstall: false }),
  getDeviceInfo: noopAsyncVoid,
  exportLog: noopAsyncVoid,
  resetLog: noopAsyncVoid,
  notify: noopVoid,
  windowReady: noopVoid,
  isWindowVisible: noopAsyncBool,
  openURI: noopAsyncVoid,
  pickFile: noopAsyncString,
  pickFolder: noopAsyncString,
  linkAccount: noopAsyncVoid,
  handleProtocol: noopVoid,
  /** @param {'stable' | 'nightly'} channel */
  setUpdateChannel: (channel = 'stable') => {},
  /** @param {'stable' | 'nightly'} channel */
  checkForUpdates: (channel = 'stable') => {},
  quitAndInstall: noopVoid,
  onUpdateAvailable: noopVoid,
  onUpdateDownloaded: noopVoid,
  onUpdateProgress: noopVoid,
  onUpdateAborted: noopVoid,
  onLobbyInvite: noopVoid,
  onRequestPage: noopVoid,
  onRequestModal: noopVoid,
  onProviderToken: noopVoid,
  onRequestPlay: noopVoid
}
const androidDefaults = {
  minimize: noopVoid,
  showSplash: noopVoid,
  toast: noopAsyncVoid,
  onBackButton: noopVoid,
  onAppStateChange: noopAsyncVoid,
  onPictureInPictureModeChanged: noopAsyncVoid,
  onMediaAction: noopAsyncVoid,
  setMediaSession: noopVoid,
  exitPiP: noopAsyncVoid,
  hideStatusBar: noopVoid,
  /** @param {'LIGHT' | 'DARK'} style */
  setSystemStyle: (style = 'LIGHT') => {},
  requestFileAccess: async () => ({ granted: true }),
  launchExternal: noopAsyncVoid
}
const electronDefaults = {
  exit: noopVoid,
  cacheFlushed: noopVoid,
  setDoH: noopVoid,
  getAngle: async () => 'default',
  setAngle: noopVoid,
  isMinimized: noopAsyncBool,
  isFullScreen: noopAsyncBool,
  onMinimize: noopVoid,
  onFullScreen: noopVoid,
  hideWindow: noopVoid,
  showAndFocus: noopVoid,
  onExitIntent: noopVoid,
  onFlushCache: noopVoid,
  openTorrentDevTools: noopVoid,
  openDevTools: noopVoid,
  setUnreadCount: noopVoid,
  setDiscordRPC: noopVoid,
  setPresence: noopVoid,
  clearPresence: noopVoid,
  showTextContextMenu: noopVoid,
  onSelectContextText: noopVoid,
  getYouTube: async () => 'https://www.youtube-nocookie.com'
}

export const TORRENT = window.torrent || torrentDefaults
export const COMMON = window.common || commonDefaults
export const ANDROID = window.android || androidDefaults
export const ELECTRON = window.electron || electronDefaults