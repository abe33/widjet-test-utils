import expect from 'expect.js'
import jsdom from 'mocha-jsdom'
import sinon from 'sinon'

import {fakeBoundingClientRects, getBox} from '../src/dom'
import {
  mousedown, mouseover, mouseout, mousemove, mouseup, mousewheel, click,
  touchstart, touchmove, touchend,
  keydown, keyup, keypress
} from '../src/events'

describe('events helper', () => {
  jsdom()

  fakeBoundingClientRects(function () { return getBox(0, 0, 100, 200) })

  let div, spy

  const mouseEvents = [
    'mousedown', 'mouseover', 'mouseout', 'mousemove', 'mouseup', 'click'
  ]
  const mouseHelpers = {
    mousedown, mouseover, mouseout, mousemove, mouseup, click
  }

  beforeEach(() => {
    document.body.innerHTML = '<div></div>'
    div = document.querySelector('div')
  })

  mouseEvents.forEach((key) => {
    describe(`${key}()`, () => {
      beforeEach(() => {
        spy = sinon.spy()
        div.addEventListener(key, spy)
      })

      it(`triggers a ${key} event on the target element`, () => {
        mouseHelpers[key](div)
        expect(spy.called).to.be.ok()
      })

      describe('without options', () => {
        it('uses the center of the element as coordinates for the event', () => {
          mouseHelpers[key](div)
          const event = spy.firstCall.args[0]

          expect(event.pageX).to.eql(50)
          expect(event.pageY).to.eql(100)
        })
      })

      describe('with options', () => {
        it('use the passed-in options for the event properties', () => {
          mouseHelpers[key](div, {x: 10, y: 20, cx: 100, cy: 200, btn: 3})
          const event = spy.firstCall.args[0]

          expect(event.button).to.eql(3)
          expect(event.pageX).to.eql(10)
          expect(event.pageY).to.eql(20)
          expect(event.clientX).to.eql(100)
          expect(event.clientY).to.eql(200)
        })
      })
    })
  })

  describe('mousewheel()', () => {
    beforeEach(() => {
      spy = sinon.spy()
      div.addEventListener('mousewheel', spy)
    })

    describe('without options', () => {
      it('emits a wheel event with no delta', () => {
        mousewheel(div)

        expect(spy.called).to.be.ok()

        const event = spy.firstCall.args[0]

        expect(event.deltaX).to.eql(0)
        expect(event.deltaY).to.eql(0)
        expect(event.wheelDeltaX).to.eql(0)
        expect(event.wheelDeltaY).to.eql(0)
      })
    })

    describe('with options', () => {
      it('emits a wheel event the specified delta', () => {
        mousewheel(div, 10, 20)

        expect(spy.called).to.be.ok()

        const event = spy.firstCall.args[0]

        expect(event.deltaX).to.eql(20)
        expect(event.deltaY).to.eql(10)
        expect(event.wheelDeltaX).to.eql(20)
        expect(event.wheelDeltaY).to.eql(10)
      })
    })
  })

  const keyboardEvents = ['keydown', 'keyup', 'keypress']
  const keyboardHelpers = {keydown, keyup, keypress}

  keyboardEvents.forEach((key) => {
    describe(`${key}()`, () => {
      beforeEach(() => {
        spy = sinon.spy()
        div.addEventListener(key, spy)
      })

      it(`triggers a ${key} event on the target element`, () => {
        keyboardHelpers[key](div, {})

        expect(spy.called).to.be.ok()
      })
    })
  })

  const touchEvents = ['touchstart', 'touchmove', 'touchend']
  const touchHelpers = {touchstart, touchmove, touchend}

  touchEvents.forEach((key) => {
    describe(`${key}()`, () => {
      beforeEach(() => {
        spy = sinon.spy()
        div.addEventListener(key, spy)
      })

      describe('with a single touch passed as an object', () => {
        describe('without any properties', () => {
          it(`triggers a ${key} event on the target element`, () => {
            touchHelpers[key](div, {})

            expect(spy.called).to.be.ok()

            const event = spy.firstCall.args[0]

            expect(event.touches).to.have.length(1)
            expect(event.changedTouches).to.have.length(1)
            expect(event.targetTouches).to.have.length(1)

            const touch = event.touches[0]

            expect(touch.target).to.be(div)
            expect(touch.pageX).to.be(50)
            expect(touch.pageY).to.be(100)
            expect(touch.clientX).to.be(50)
            expect(touch.clientY).to.be(100)
          })
        })

        describe('with properties', () => {
          describe('using their real names', () => {
            it(`triggers a ${key} event on the target element`, () => {
              touchHelpers[key](div, {
                target: 'foo',
                pageX: 5,
                pageY: 10,
                clientX: 150,
                clientY: 100
              })

              expect(spy.called).to.be.ok()

              const event = spy.firstCall.args[0]

              expect(event.touches).to.have.length(1)
              expect(event.changedTouches).to.have.length(1)
              expect(event.targetTouches).to.have.length(1)

              const touch = event.touches[0]

              expect(touch.target).to.eql('foo')
              expect(touch.pageX).to.be(5)
              expect(touch.pageY).to.be(10)
              expect(touch.clientX).to.be(150)
              expect(touch.clientY).to.be(100)
            })
          })

          describe('using their aliased names', () => {
            it(`triggers a ${key} event on the target element`, () => {
              touchHelpers[key](div, {
                target: 'foo',
                x: 5,
                y: 10,
                cx: 150,
                cy: 100
              })

              expect(spy.called).to.be.ok()

              const event = spy.firstCall.args[0]

              expect(event.touches).to.have.length(1)
              expect(event.changedTouches).to.have.length(1)
              expect(event.targetTouches).to.have.length(1)

              const touch = event.touches[0]

              expect(touch.target).to.eql('foo')
              expect(touch.pageX).to.be(5)
              expect(touch.pageY).to.be(10)
              expect(touch.clientX).to.be(150)
              expect(touch.clientY).to.be(100)
            })
          })
        })
      })

      describe('with many touches', () => {
        it(`triggers a ${key} event on the target element`, () => {
          touchHelpers[key](div, [{}, {}, {}])

          expect(spy.called).to.be.ok()

          const event = spy.firstCall.args[0]

          expect(event.touches).to.have.length(3)
          expect(event.changedTouches).to.have.length(3)
          expect(event.targetTouches).to.have.length(3)
        })
      })
    })
  })
})
