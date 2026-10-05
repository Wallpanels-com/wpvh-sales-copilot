import { test } from 'node:test'
import assert from 'node:assert/strict'
import { classifyAttention } from './attention.js'

const now=new Date('2026-10-06T15:00:00Z')
test('standalone acknowledgement does not become an unanswered request',()=>{
  for(const body of ['Thanks!','Got it','Sounds good','Perfect, thank you','👍','Great, see you then']){
    const result=classifyAttention({status:'open',lastInbound:body,lastInboundAt:'2026-10-06T14:00:00Z',lastHumanOutboundAt:'2026-10-06T13:00:00Z'},now)
    assert.equal(result.attention_type,'waiting_for_client',body)
    assert.equal(result.requires_response,false,body)
  }
})
test('a direct client request after a human reply needs attention',()=>{
  const result=classifyAttention({status:'open',lastInbound:'Can you send the estimate?',lastInboundAt:'2026-10-06T14:00:00Z',lastHumanOutboundAt:'2026-10-06T13:00:00Z'},now)
  assert.equal(result.attention_type,'needs_reply')
  assert.equal(result.requires_response,true)
})
test('a human reply after a request leaves us waiting for client',()=>{
  const result=classifyAttention({status:'open',lastInbound:'Can you send the estimate?',lastInboundAt:'2026-10-06T12:00:00Z',lastHumanOutboundAt:'2026-10-06T13:00:00Z'},now)
  assert.equal(result.attention_type,'waiting_for_client')
})
