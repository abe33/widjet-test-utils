import expect from 'expect.js'

import {waitsFor} from '../src/async'

describe('async helpers', () => {
  describe('waitsFor()', () => {
    beforeEach(() => {
      let i = 0
      return waitsFor(() => i++ > 100)
    })
    it('returns a promise that resolve when the passed-in function returns true', () => {
      expect(true).to.be.ok()
    })

    it('rejects the promise when reaching the timeout', (done) => {
      waitsFor('failing message', () => false, 200).catch((e) => {
        expect(e.message).to.eql('Waited 200ms for failing message but nothing happened')
        done()
      })
    })
  })
})
