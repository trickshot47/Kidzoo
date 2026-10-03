/**
 * Global custom select dropdown overlay.
 *
 * Replaces the native OS <select> popup (which shows a white background on
 * Chrome/Windows) with a fully-styled dark dropdown panel.
 *
 * Works by intercepting mousedown on every <select> in the page, preventing
 * the native popup, and rendering a positioned overlay with the same options.
 * Svelte bind:value + on:change handlers continue to work because we set
 * select.selectedIndex and dispatch a real "change" event.
 */

let activeOverlay = null
let activeSelect = null

function closeOverlay () {
  if (activeOverlay) {
    activeOverlay.remove()
    activeOverlay = null
    activeSelect = null
  }
}

function createOverlay (select) {
  closeOverlay()

  const rect = select.getBoundingClientRect()
  const overlay = document.createElement('div')
  overlay.className = 'csd-dropdown'

  overlay.style.position = 'fixed'
  overlay.style.left = rect.left + 'px'
  overlay.style.top = (rect.bottom + 2) + 'px'
  overlay.style.minWidth = rect.width + 'px'
  overlay.style.zIndex = '99999'

  // Walk through the select's children (option / optgroup)
  for (const child of select.children) {
    if (child.tagName === 'OPTGROUP') {
      const label = document.createElement('div')
      label.className = 'csd-group-label'
      label.textContent = child.label
      overlay.appendChild(label)

      for (const option of child.children) {
        overlay.appendChild(makeItem(select, option))
      }
    } else if (child.tagName === 'OPTION') {
      overlay.appendChild(makeItem(select, child))
    }
  }

  document.body.appendChild(overlay)
  activeOverlay = overlay
  activeSelect = select

  // Scroll the selected item into view
  const selected = overlay.querySelector('.csd-selected')
  if (selected) selected.scrollIntoView({ block: 'nearest' })

  // Reposition if overflowing viewport
  requestAnimationFrame(() => {
    const oRect = overlay.getBoundingClientRect()
    if (oRect.bottom > window.innerHeight) {
      overlay.style.top = Math.max(4, rect.top - oRect.height - 2) + 'px'
    }
    if (oRect.right > window.innerWidth) {
      overlay.style.left = Math.max(4, window.innerWidth - oRect.width - 8) + 'px'
    }
  })
}

function makeItem (select, option) {
  const item = document.createElement('div')
  item.className = 'csd-option'
  if (option.selected) item.classList.add('csd-selected')
  if (option.disabled) item.classList.add('csd-disabled')
  item.textContent = option.textContent
  item.dataset.index = option.index

  if (!option.disabled) {
    item.addEventListener('click', (e) => {
      e.stopPropagation()
      select.selectedIndex = option.index
      select.dispatchEvent(new Event('change', { bubbles: true }))
      select.dispatchEvent(new Event('input', { bubbles: true }))
      closeOverlay()
    })
  }

  return item
}

export function initCustomSelects () {
  // Intercept mousedown on all <select> elements
  document.addEventListener('mousedown', (e) => {
    const select = e.target.closest('select')

    if (!select) {
      // Click outside – close the overlay
      if (activeOverlay && !e.target.closest('.csd-dropdown')) {
        closeOverlay()
      }
      return
    }

    if (select.disabled) return

    // Prevent native popup
    e.preventDefault()

    // Toggle overlay if clicking the same select
    if (activeSelect === select) {
      closeOverlay()
    } else {
      createOverlay(select)
    }
  })

  // Close on Escape; intercept Space/Enter on focused selects
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeOverlay()
      return
    }
    if ((e.key === ' ' || e.key === 'Enter') && document.activeElement?.tagName === 'SELECT') {
      e.preventDefault()
      if (activeSelect === document.activeElement) {
        closeOverlay()
      } else {
        createOverlay(document.activeElement)
      }
    }
  })

  // Close on scroll outside the dropdown
  document.addEventListener('scroll', (e) => {
    if (activeOverlay && !activeOverlay.contains(e.target)) closeOverlay()
  }, true)
  window.addEventListener('resize', closeOverlay)
}
