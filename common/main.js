import 'quartermoon/css/quartermoon-variables.css'
import '@fontsource-variable/nunito'
import { cache, cacheReady, migrationStatus } from '@/modules/cache.js'
import { SUPPORTS } from '@/modules/support.js'
import { COMMON, ELECTRON } from '@/modules/bridge.js'
import { initCustomSelects } from '@/modules/lib/customSelect.js'
import '@/css.css'
import '@/themes.css'
import '@/typography.css'

window.addEventListener('error', e => {
  if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || e.message === 'ResizeObserver loop limit exceeded') {
    e.stopImmediatePropagation()
  }
})

initCustomSelects()

let splash
if (!SUPPORTS.isAndroid && await COMMON.isWindowVisible()) {
  const { default: Splash } = await import('./Splash.svelte')
  splash = new Splash({ target: document.body })
}

let migration = null
const unsubscribe = migrationStatus.subscribe(value => {
  if (value !== null && !migration) {
    import('./Migration.svelte').then(({ default: Migration }) => {
      migration = new Migration({ target: document.body })
    })
  }
})

await cacheReady()
ELECTRON.onFlushCache(async () => {
  try {
    await cache.flush()
  } finally {
    ELECTRON.cacheFlushed()
  }
})

unsubscribe()
const target = migration ?? splash
if (target) {
  target.$set({ done: true })
  setTimeout(() => target.$destroy(), 900).unref?.()
}

const { default: App } = await import('./App.svelte')
new App({ target: document.body })