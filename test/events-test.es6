import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'

import {mousedown, mouseover, mouseout, mousemove, mouseup, click} from '../src/events'

describe('events helper', () => {
  jsdom()

  let div

  const mouseEvents = [
    'mousedown', 'mouseover', 'mouseout', 'mousemove', 'mouseup', 'click'
  ]
  const mouseHelpers = {
    mousedown, mouseover, mouseout, mousemove, mouseup, click
  }

  mouseEvents.forEach((key) => {
    beforeEach(() => {
      document.body.innerHTML = '<div></div>'
      div = document.querySelector('div')
    })

    describe(`${key}()`, () => {
      it(`triggers a ${key} event on the target element`, () => {
        const spy = sinon.spy()
        div.addEventListener(key, spy)
        mouseHelpers[key](div)

        expect(spy.called).to.be.ok()
      })
    })
  })
})
