export function getBox (top, left, width, height) {
  return {
    top, left,
    width, height,
    right: top + width,
    bottom: top + height
  }
}

export function setPageContent (content) {
  const container = document.querySelector('#mocha-container') || document.body
  container.innerHTML = content
}

export function objectCenterCoordinates (obj) {
  const {top, left, width, height} = obj.getBoundingClientRect()
  return {x: left + width / 2, y: top + height / 2}
}

export function fakeBoundingClientRects (patchFunction) {
  let safeGetBoundingClientRect

  beforeEach(() => {
    safeGetBoundingClientRect = window.HTMLElement.prototype.getBoundingClientRect
    window.HTMLElement.prototype.getBoundingClientRect = patchFunction
  })
  afterEach(() => {
    window.HTMLElement.prototype.getBoundingClientRect = safeGetBoundingClientRect
  })
}
