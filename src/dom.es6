import {asPair} from 'widjet-utils'

if (!Object.getPropertyDescriptor) {
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
  Object.getPropertyDescriptor = function getPropertyDescriptor (o, name) {
    let descriptor
    let proto = o
    while (proto && !(descriptor = getOwnPropertyDescriptor(proto, name))) {
      proto = Object.getPrototypeOf(proto)
    }
    return descriptor
  }
}

export function getBox (left, top, width, height) {
  return {
    top, left,
    width, height,
    right: left + width,
    bottom: top + height
  }
}

export function setPageContent (content) {
  getTestRoot().innerHTML = content
}

export function getTestRoot () {
  return document.querySelector('#mocha-container') || document.body
}

export function objectCenterCoordinates (obj) {
  const {top, left, width, height} = obj.getBoundingClientRect()
  return {x: left + width / 2, y: top + height / 2}
}

const getter = (get) => ({
  get,
  configurable: true,
  enumerable: true
})

export function fakeBoundingClientRects (patchFunction) {
  const safe = {}
  const patches = {
    getBoundingClientRect: {
      value: function () {
        return patchFunction.call(this) || getBox(0, 0, window.innerWidth, window.innerHeight)
      },
      configurable: true
    },
    offsetTop: getter(function () {
      return this.getBoundingClientRect().top - this.parentNode.getBoundingClientRect().top
    }),
    offsetLeft: getter(function () {
      return this.getBoundingClientRect().left - this.parentNode.getBoundingClientRect().left
    }),
    offsetWidth: getter(function () {
      return this.getBoundingClientRect().width
    }),
    offsetHeight: getter(function () {
      return this.getBoundingClientRect().height
    })
  }

  beforeEach(() => {
    const proto = window.HTMLElement.prototype
    asPair(patches).forEach(([attr, descriptor]) => {
      safe[attr] = Object.getPropertyDescriptor(proto, attr)
      Object.defineProperty(proto, attr, descriptor)
    })
  })
  afterEach(() => {
    const proto = window.HTMLElement.prototype
    asPair(safe).forEach(([attr, descriptor]) => {
      descriptor && Object.defineProperty(proto, attr, descriptor)
    })
  })
}
