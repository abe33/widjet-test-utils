import expect from 'expect.js'
import jsdom from 'mocha-jsdom'

import {fakeBoundingClientRects, getBox, setPageContent, getTestRoot} from '../src/dom'

describe('dom helper', () => {
  jsdom()

  let child, parent

  fakeBoundingClientRects(function () {
    if (this.classList.contains('parent')) {
      return getBox(100, 50, 100, 200)
    } else if (this.classList.contains('child')) {
      return getBox(120, 70, 60, 160)
    }
  })

  beforeEach(() => {
    setPageContent(`
      <div class="parent">
        <div class="child"></div>
      </div>
    `)

    child = getTestRoot().querySelector('.child')
    parent = getTestRoot().querySelector('.parent')
  })

  describe('HTMLElement#getBoundingClientRect()', () => {
    it('returns the specified bounds', () => {
      expect(child.getBoundingClientRect()).to.eql(getBox(120, 70, 60, 160))
      expect(parent.getBoundingClientRect()).to.eql(getBox(100, 50, 100, 200))
      expect(document.body.getBoundingClientRect()).to.eql(getBox(0, 0, window.innerWidth, window.innerHeight))
    })
  })

  describe('HTMLElement#offsetTop', () => {
    it('returns the offset inside the parents coordinates', () => {
      expect(child.offsetTop).to.eql(20)
      expect(parent.offsetTop).to.eql(50)
    })
  })

  describe('HTMLElement#offsetLeft', () => {
    it('returns the offset inside the parents coordinates', () => {
      expect(child.offsetLeft).to.eql(20)
      expect(parent.offsetLeft).to.eql(100)
    })
  })

  describe('HTMLElement#offsetWidth', () => {
    it('returns the element width', () => {
      expect(child.offsetWidth).to.eql(60)
      expect(parent.offsetWidth).to.eql(100)
    })
  })

  describe('HTMLElement#offsetHeight', () => {
    it('returns the element height', () => {
      expect(child.offsetHeight).to.eql(160)
      expect(parent.offsetHeight).to.eql(200)
    })
  })
})
