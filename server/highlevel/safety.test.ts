import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertCRMWriteAllowed } from './safety.js'
import { config } from '../config.js'

const target={session:{profile:{id:'p',email:'a@example.test',full_name:'A',role:'sales' as const,active:true},mappings:[{location_id:'loc',ghl_user_id:'user',brand:'WallPanels'}]},locationId:'loc',contactId:'c',opportunityId:'o',idempotencyKey:'once'}
test('server-side write switch rejects mutations before any provider call',()=>{
  const previous=config.crmWriteEnabled
  config.crmWriteEnabled=false
  try{assert.throws(()=>assertCRMWriteAllowed(target),{code:'WRITE_DISABLED'})}finally{config.crmWriteEnabled=previous}
})
test('safe mode requires both target IDs in allowlists',()=>{
  const write=config.crmWriteEnabled,safe=config.safeTestMode
  config.crmWriteEnabled=true;config.safeTestMode=true
  try{assert.throws(()=>assertCRMWriteAllowed(target),{code:'TARGET_NOT_ALLOWLISTED'})}finally{config.crmWriteEnabled=write;config.safeTestMode=safe}
})
