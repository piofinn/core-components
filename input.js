const KEY = 'core-input'
let LIST, LIVE

function attr (elem, prop, value) {
  if (typeof elem === 'string') elem = document.createElement(elem)
  if (typeof prop === 'object') Object.keys(prop).forEach((k) => attr(elem, k, prop[k]))
  else if (value === null) elem.removeAttribute(prop)
  else if (prop) elem.setAttribute(prop, value)
  return elem
}

function render (elem) {
  const state = elem[KEY]
  const value = state.value.trim().toLowerCase()
  state.hits = state.items.filter((item) => item.value.toLowerCase().indexOf(value) !== -1)

  attr(LIVE, 'aria-hidden', false)
  attr(LIST, 'hidden', state.hits.length ? null : true)
  attr(elem, 'aria-haspopup', Boolean(state.hits.length))
  attr(elem, 'aria-expanded', Boolean(state.hits.length))

  LIST.innerHTML = state.hits.map(({value}, i) =>
    `<li role="option" aria-selected="${i === state.index}">${value}</li>`
  ).join('')
}

function onFocus (event) {
  const elem = event.target
  const owns = elem.getAttribute(`data-${KEY}`)

  if (owns && !elem[KEY]) {
    const mode = elem.getAttribute(`data-${KEY}-mode`) || 'suggestions'
    const items = [].map.call(document.querySelectorAll(`#${owns} > *`), ({value}) => ({value}))
    const parent = elem.parentElement

    attr(elem, {
      'role': 'combobox',
      'autocomplete': 'off',
      'aria-owns': `${KEY}-${owns}`,
      'aria-autocomplete': 'list',
      'aria-haspopup': false,
      'aria-expanded': false
    })

    parent.className = parent.className.split(' ').concat(KEY).join(' ')
    elem[KEY] = {items, mode}
  }

  if (owns) {
    LIST.id = `${KEY}-${owns}`
    elem.insertAdjacentElement('afterend', LIST)
    onInput(event)
  }
}

function onBlur ({target}) {
  if (target[KEY]) {
    attr(LIST, 'hidden', 'hidden')
    attr(LIVE, {'aria-hidden': 'true', 'aria-live': 'polite'})
  }
}

function onInput (event) {
  const elem = event.target
  const state = elem[KEY]

  if (state) {
    state.index = -1
    state.value = elem.value
    render(elem)
    LIVE.textContent = `${state.hits.length} treff`
  }
}

function onKey (event) {
  if (event.target[KEY]) {
    const elem = event.target
    const state = elem[KEY]
    if (event.keyCode === 27) onBlur(event)
    if (event.keyCode === 38 || event.keyCode === 40) {
      event.preventDefault()
      const hits = [].slice.call(LIST.children)
      const selected = hits.filter((el) => el.getAttribute('aria-selected') === 'true')[0]
      state.index = (hits.indexOf(selected) + (event.keyCode === 38 ? -1 : 1)) % hits.length
      LIVE.setAttribute('aria-live', 'assertive')

      render(event.target)
      const value = (state.hits[state.index] || state).value
      if (state.mode === 'results') {
        LIVE.textContent = value || 'Tomt tekstfelt'
      } else {
        elem.value = value
      }
    }
  }
}

if (typeof document !== 'undefined') {
  LIST = attr('ul', {'role': 'listbox'})
  LIVE = attr('span', {'aria-hidden': 'true', 'aria-live': 'polite'})

  document.addEventListener('keydown', onKey)
  document.addEventListener('input', onInput)
  document.addEventListener('focus', onFocus, true) // Use capture to ensure event bubling
  document.addEventListener('blur', onBlur, true)   // Use capture to ensure event bubling

  document.documentElement.appendChild(LIVE)
  document.head.appendChild(document.createElement('style')).textContent = `datalist{display:none}`
}

module.exports = () => console.log('input')