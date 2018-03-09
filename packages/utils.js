const IS_ANDROID = typeof window !== 'undefined' && /(android)/i.test(window.navigator.userAgent) // Bad, but needed
const FOCUSABLE = 'a,button,input,select,textarea,iframe,[tabindex],[contenteditable="true"]'

/**
* assign
* @param {Object} target The target object
* @param {Object} sources The source object(s)
* @return {Object} The target object
*/
export function assign (target, ...sources) {
  sources.filter(Boolean).forEach((source) => {
    Object.keys(source).forEach((key) => (target[key] = source[key]))
  })
  return target
}

/**
* addEvent
* @param {String} uuid An unique ID of the event to bind - ensurnes single instance
* @param {String} type The type of event to bind
* @param {Function} handler The function to call on event
*/
export function addEvent (uuid, type, handler) {
  if (typeof window === 'undefined' || window[`${uuid}-${type}`]) return        // Ensure single instance
  document.addEventListener(type, handler, window[`${uuid}-${type}`] = true)    // Use capture for old Firefox
}

export function ariaExpand (master, open) {
  const relatedTarget = ariaTarget(master)
  const prevState = master.getAttribute('aria-expanded') === 'true'
  const wantState = typeof open === 'boolean' ? open : (open === 'toggle' ? !prevState : prevState)
  const canUpdate = prevState === wantState || dispatchEvent(master, 'toggle', {relatedTarget, isOpen: prevState})
  const nextState = canUpdate ? wantState : prevState

  relatedTarget[nextState ? 'removeAttribute' : 'setAttribute']('hidden', '')   // Toggle hidden attribute
  master.setAttribute('aria-expanded', nextState)                               // Set expand always
  return nextState
}

export function ariaTarget (master, relationType, targetElement) {
  const targetId = master.getAttribute('aria-controls') || master.getAttribute('aria-owns') || master.getAttribute('list')
  const target = targetElement || document.getElementById(targetId) || master.nextElementSibling
  const label = IS_ANDROID ? 'data' : 'aria'   // Andriod has a bug and reads only label instead of content

  if (!target) throw new Error(`missing nextElementSibling on ${master.outerHTML}`)
  if (relationType) {
    master.setAttribute(`aria-${relationType}`, target.id = target.id || getUUID())
    target.setAttribute(`${label}-labelledby`, master.id = master.id || getUUID())
  }
  return target
}

/**
* CustomEvent
* See {@link https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent}
* @param {String} eventName A case-sensitive string representing the event type to create
* @param {Object} params.detail Any data passed when initializing the event
* @param {Boolean} params.cancelable A Boolean indicating whether the event is cancelable.
* @param {Boolean} params.bubbles A Boolean indicating whether the event bubbles up through the DOM or not.
* @return {CustomEvent} Creates a CustomEvent.
*/
export const CustomEvent = (() => {
  if (typeof window === 'undefined') return
  if (typeof window.CustomEvent === 'function') return window.CustomEvent

  function CustomEvent (name, params = {}) {
    const event = document.createEvent('CustomEvent')
    event.initCustomEvent(name, Boolean(params.bubbles), Boolean(params.cancelable), params.detail)
    return event
  }

  CustomEvent.prototype = window.Event.prototype
  return CustomEvent
})()

/**
* debounce
* @param {Function} callback The function to debounce
* @param {Number} ms The number of milliseconds to delay
* @return {Function} The new debounced function
*/
export function debounce (callback, ms) {
  let timer
  return function (...args) {
    const self = this
    clearTimeout(timer)
    timer = setTimeout(() => callback.apply(self, args), ms)
  }
}

/**
* dispatchEvent
* @param {Element} elem The target object
* @param {String} name The source object(s)
* @param {Object} detail Detail object (bubbles and cancelable defaults to true)
* @return {Boolean} Whether the event was cance
*/
export function dispatchEvent (elem, name, detail = {}) {
  return elem.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    cancelable: true,
    detail
  }))
}

/**
* getUUID
* @return {String} A generated unique ID
*/
export function getUUID (el, attr) {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5)
}

/**
* isVisible
* @param {Element} el A element to check visibility on
* @return {Boolean} True of false based on visibility
*/
export function isVisible (el) {
  return el.offsetWidth && el.offsetHeight && window.getComputedStyle(el).getPropertyValue('visibility') !== 'hidden'
}

/**
* queryAll
* @param {String|NodeList|Array|Element} elements A CSS selector string, nodeList, element array, or single element
* @return {Array} Array of elements
*/
export function queryAll (elements, context = document) {
  if (elements === ':focusable') return queryAll(FOCUSABLE, context).filter((el) => !el.disabled && isVisible(el))
  if (typeof elements === 'string') return queryAll(context.querySelectorAll(elements))
  if (elements.length) return [].slice.call(elements)
  return elements.nodeType ? [elements] : []
}