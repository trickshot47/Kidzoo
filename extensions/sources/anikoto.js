// AbstractSource inlined to avoid import dependency in production
class AbstractSource {
  single (options) { throw new Error('Source does not implement method #single()') }
  batch (options) { throw new Error('Source does not implement method #batch()') }
  movie (options) { throw new Error('Source does not implement method #movie()') }
  validate () { throw new Error('Source does not implement method #validate()') }
}

/**
 * AniKoto streaming source extension.
 * Fetches real-time stream URLs from anikototv.to via the AniKoto API.
 *
 * All fetch() calls are automatically proxied through /cors-proxy by the
 * extension worker's globalThis.fetch override — no manual proxying needed.
 *
 * @extends AbstractSource
 */
export default new class AniKotoSource extends AbstractSource {
  settings = {}

  get #apiBase() {
    let url = this.settings?.apiUrl?.replace(/\/$/, '') || 'https://anikoto-api-psi.vercel.app'
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      url = 'https://anikoto-api-psi.vercel.app'
    }
    return url + '/api'
  }

  get #preferDub() {
    return this.settings?.preferDub ?? true
  }

  /**
   * Searches AniKoto for an anime matching the given titles and returns its animeId.
   * @param {string[]} titles - List of titles to try (romaji, english, etc.)
   * @returns {Promise<string|null>} The animeId if found, else null
   */
  async #searchAnime(titles) {
    for (const title of titles) {
      try {
        const res = await fetch(`${this.#apiBase}/search?keyword=${encodeURIComponent(title)}`)
        if (!res.ok) continue
        const json = await res.json()
        const results = json?.results?.data
        if (!results?.length) continue
        // Try to find an exact or close match
        const normalized = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
        const match = results.find(r => {
          const rTitle = (r.title || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
          return rTitle === normalized || rTitle.startsWith(normalized) || normalized.startsWith(rTitle)
        }) || results[0]
        if (match?.animeId) return { animeId: match.animeId, slug: match.slug }
      } catch (_) { /* try next title */ }
    }
    return null
  }

  /**
   * Gets the server_ids string for a specific episode number of an anime.
   * @param {string} animeId - The AniKoto anime ID
   * @param {number} episodeNumber - The episode number to find
   * @returns {Promise<string|null>} The server_ids string for the episode
   */
  async #getEpisodeServerIds(animeId, episodeNumber) {
    const res = await fetch(`${this.#apiBase}/episodes/${animeId}`)
    if (!res.ok) return null
    const json = await res.json()
    const episodes = json?.results?.episodes
    if (!episodes?.length) return null
    const ep = episodes.find(e => Number(e.episode_no) === Number(episodeNumber))
    return ep?.server_ids || null
  }

  /**
   * Gets available streaming servers for an episode given its server_ids.
   * @param {string} serverIds - The encoded server_ids string from episodes endpoint
   * @returns {Promise<Array>} List of server objects with link_id, name, type
   */
  async #getServers(serverIds) {
    const res = await fetch(`${this.#apiBase}/servers?ids=${encodeURIComponent(serverIds)}`)
    if (!res.ok) return []
    const json = await res.json()
    return json?.results || []
  }

  /**
   * Gets the embed/stream URL for a given link_id.
   * @param {string} linkId - The encoded link_id from servers endpoint
   * @returns {Promise<string|null>} The embed URL
   */
  async #getStreamUrl(linkId) {
    const res = await fetch(`${this.#apiBase}/stream?id=${encodeURIComponent(linkId)}`)
    if (!res.ok) return null
    const json = await res.json()
    return json?.results?.url || null
  }

  /**
   * Builds TorrentResult-compatible stream results for display in the Sources modal.
   * @param {string[]} titles - Anime title variants
   * @param {number|null} episode - Episode number (null for movies)
   * @param {boolean} isMovie - Whether this is a movie
   * @returns {Promise<import('./').TorrentResult[]>}
   */
  async #query(titles, episode, isMovie = false) {
    const results = []

    const found = await this.#searchAnime(titles)
    if (!found) return [{ title: 'No results found on AniKoto', link: '', seeders: 0, leechers: 0, downloads: 0, hash: '', size: 0, date: new Date(), type: 'stream' }]

    const episodeNumber = isMovie ? 1 : (episode || 1)
    const serverIds = await this.#getEpisodeServerIds(found.animeId, episodeNumber)
    if (!serverIds) return [{ title: 'Episode not found on AniKoto', link: '', seeders: 0, leechers: 0, downloads: 0, hash: '', size: 0, date: new Date(), type: 'stream' }]

    const servers = await this.#getServers(serverIds)
    if (!servers.length) return [{ title: 'No servers available on AniKoto', link: '', seeders: 0, leechers: 0, downloads: 0, hash: '', size: 0, date: new Date(), type: 'stream' }]

    // Fetch all servers without filtering by preferType
    const serverList = servers

    // Pick best servers - prioritize HD-1 and Vidstream
    const priority = ['hd', 'vidstream']
    const sorted = [...serverList].sort((a, b) => {
      // Group by sub/dub first
      if (a.type !== b.type) return a.type === 'dub' ? -1 : 1
      const ai = priority.findIndex(p => a.normalizedName?.includes(p))
      const bi = priority.findIndex(p => b.normalizedName?.includes(p))
      if (ai === -1 && bi === -1) return 0
      if (ai === -1) return 1
      if (bi === -1) return -1
      return ai - bi
    })

    // Get stream URLs for top 2 sub and top 2 dub servers
    const topServers = []
    const subs = sorted.filter(s => s.type === 'sub').slice(0, 2)
    const dubs = sorted.filter(s => s.type === 'dub').slice(0, 2)
    topServers.push(...subs, ...dubs)

    for (const server of topServers) {
      if (!server.link_id) continue
      const streamUrl = await this.#getStreamUrl(server.link_id)
      if (!streamUrl) continue

      results.push({
        title: `${titles[0]} - Ep ${episodeNumber} [${server.type.toUpperCase()}] (${server.name})`,
        link: streamUrl,
        url: streamUrl,
        seeders: 0,
        leechers: 0,
        downloads: 0,
        hash: streamUrl,
        size: 0,
        accuracy: 'high',
        date: new Date(),
        type: 'stream',
        source: { name: `AniKoto • ${server.name}`, icon: null }
      })
    }

    if (!results.length) {
      results.push({ title: 'Stream URL could not be resolved from AniKoto', link: '', seeders: 0, leechers: 0, downloads: 0, hash: '', size: 0, date: new Date(), type: 'stream' })
    }

    return results
  }

  /** @type {import('./').SearchFunction} */
  async single({ titles, episode }) {
    return this.#query(titles, episode, false)
  }

  /** @type {import('./').SearchFunction} */
  async batch({ titles, episodeCount }) {
    return [] // AniKoto doesn't support batch — single episode streams only
  }

  /** @type {import('./').SearchFunction} */
  async movie({ titles }) {
    return this.#query(titles, 1, true)
  }

  async validate() {
    try {
      const healthUrl = `${this.#apiBase}/health`
      const res = await fetch(healthUrl)
      const json = await res.json()
      return json?.success === true
    } catch {
      return false
    }
  }
}()
