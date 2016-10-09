import {objectCenterCoordinates} from './dom'

export const mousedown = generateMouseEventMethod('mousedown')
export const mouseover = generateMouseEventMethod('mouseover')
export const mouseout = generateMouseEventMethod('mouseout')
export const mousemove = generateMouseEventMethod('mousemove')
export const mouseup = generateMouseEventMethod('mouseup')
export const click = generateMouseEventMethod('click')

export const mousewheel = (obj, deltaY = 0, deltaX = 0) => {
  obj.dispatchEvent(mouseEvent('mousewheel', {
    deltaX,
    deltaY,
    wheelDeltaX: deltaX,
    wheelDeltaY: deltaY
  }))
}

export const keydown = generateKeyboardEventMethod('keydown')
export const keyup = generateKeyboardEventMethod('keyup')
export const keypress = generateKeyboardEventMethod('keypress')

export const touchstart = generateTouchEventMethod('touchstart')
export const touchmove = generateTouchEventMethod('touchmove')
export const touchend = generateTouchEventMethod('touchend')

export const createEvent = (type, eventType, properties) => {
  try {
    return new window[type](eventType, properties)
  } catch (err) {
    const e = document.createEvent(type)
    e.initEvent(eventType, properties.bubbles, properties.cancelable)
    return e
  }
}

export function mouseEvent (type, properties) {
  const defaults = {
    bubbles: true,
    cancelable: (type !== 'mousemove'),
    view: window,
    detail: 0,
    pageX: 0,
    pageY: 0,
    clientX: 0,
    clientY: 0,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    button: 0
  }

  for (let k in defaults) {
    let v = defaults[k]
    if (!(properties[k] != null)) {
      properties[k] = v
    }
  }

  const e = createEvent('MouseEvent', type, properties)

  for (let k in properties) {
    if (e[k] !== properties[k]) {
      Object.defineProperty(e, k, {get: () => properties[k]})
    }
  }

  return e
}

export function touchEvent (type, touches) {
  const event = createEvent('Event', type, {
    bubbles: true,
    cancelable: true,
    view: window,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false
  })
  event.touches = event.changedTouches = event.targetTouches = touches

  return event
}

export function keyboardEvent (type, properties) {
  return createEvent('KeyboardEvent', type, properties)
}

function generateMouseEventMethod (name) {
  return (obj, {x, y, cx, cy, btn} = {}) => {
    const o = objectCenterCoordinates(obj)

    if (x == null) { x = o.x }
    if (y == null) { y = o.y }

    if (cx == null) { cx = x }
    if (cy == null) { cy = y }

    obj.dispatchEvent(mouseEvent(name, {
      pageX: x, pageY: y, clientX: cx, clientY: cy, button: btn
    }))
  }
}

const exists = (value) => value != null

function generateTouchEventMethod (name) {
  return (obj, touches) => {
    const o = objectCenterCoordinates(obj)

    if (!Array.isArray(touches)) { touches = [touches] }

    touches.forEach((t) => {
      if (!exists(t.target)) { t.target = obj }
      if (!exists(t.pageX)) { t.pageX = exists(t.x) ? t.x : o.x }
      if (!exists(t.pageY)) { t.pageY = exists(t.y) ? t.y : o.y }
      if (!exists(t.clientX)) { t.clientX = exists(t.x) ? t.cx : t.pageX }
      if (!exists(t.clientY)) { t.clientY = exists(t.y) ? t.cy : t.pageY }
    })

    obj.dispatchEvent(touchEvent(name, touches))
  }
}

function generateKeyboardEventMethod (name) {
  return (obj, options) => obj.dispatchEvent(keyboardEvent(name, options))
}
