import fs from 'fs';
import path from 'path';

// Simulate globalThis.fetch proxy override
globalThis.fetch = async (url, opts) => {
  console.log('Fetching:', url);
  return await import('node-fetch').then(m => m.default(url, opts));
};

const anikotoCode = fs.readFileSync('extensions/sources/anikoto.js', 'utf8');

// evaluate anikoto
const module = {};
const require = () => {};
eval(anikotoCode.replace('export default', 'module.exports = '));
const anikoto = module.exports;

anikoto.settings = { apiUrl: 'https://anikoto-api-psi.vercel.app' };

async function test() {
  try {
    console.log('Testing Re:Zero 4th Season...');
    const results = await anikoto.single({ titles: ['Re:Zero kara Hajimeru Isekai Seikatsu 4th Season', 'Re:ZERO -Starting Life in Another World- Season 4'], episode: 1 });
    console.log('RESULTS:', JSON.stringify(results, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
  }
}

test();
