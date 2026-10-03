/**
 * Vercel Serverless Function: CORS Proxy
 * Replaces the localhost:3000/cors-proxy dev server middleware for production.
 * Proxies requests to external URLs with proper CORS headers.
 */
export default async function handler(req, res) {
  const targetUrl = req.query.url

  if (!targetUrl) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  // Security: only allow http/https URLs, block loopback addresses
  let parsed
  try {
    parsed = new URL(targetUrl)
  } catch {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(403).json({ error: 'Only http/https URLs are allowed' })
  }

  if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(parsed.hostname)) {
    return res.status(403).json({ error: 'Loopback addresses are not allowed' })
  }

  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'accept': req.headers['accept'] || '*/*',
        'accept-language': 'en-US,en;q=0.9',
      },
    })

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', '*')

    // Forward content-type from upstream
    const contentType = proxyRes.headers.get('content-type')
    if (contentType) res.setHeader('Content-Type', contentType)

    res.status(proxyRes.status)
    const buffer = await proxyRes.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
