import test from 'node:test'
import assert from 'node:assert/strict'
import { belongsToLead, highLevelTimestamp } from './sync.js'

test('HighLevel epoch milliseconds and ISO dates become database timestamps', () => {
  assert.equal(highLevelTimestamp('1628008053263'), '2021-08-03T16:27:33.263Z')
  assert.equal(highLevelTimestamp(1628008053263), '2021-08-03T16:27:33.263Z')
  assert.equal(highLevelTimestamp('2023-10-01T12:00:00Z'), '2023-10-01T12:00:00.000Z')
  assert.equal(highLevelTimestamp('2023-10-01T12:00:00+00:00'), '2023-10-01T12:00:00.000Z')
  assert.equal(highLevelTimestamp('invalid'), null)
})

test('conversation and message ownership is checked against the requested lead', () => {
  assert.equal(belongsToLead({contactId:'mary-contact',locationId:'wallpanels'},'mary-contact','wallpanels'),true)
  assert.equal(belongsToLead({contactId:'other-contact',locationId:'wallpanels'},'mary-contact','wallpanels'),false)
  assert.equal(belongsToLead({contactId:'mary-contact',locationId:'other-location'},'mary-contact','wallpanels'),false)
  assert.equal(belongsToLead({},'mary-contact','wallpanels'),false)
})
