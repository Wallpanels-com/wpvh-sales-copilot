import { createHash } from 'node:crypto'
import { ApiError, requireOwnedOpportunity, type Session } from '../auth.js'
import { requireDb } from '../db.js'
import { assertCRMWriteAllowed } from './safety.js'
import { ghlRequest } from './client.js'
import { highlevelRead } from './read.js'

type Target = { session: Session; locationId: string; contactId: string; opportunityId: string; idempotencyKey: string }
async function guardedWrite<T>(target: Target, action: string, details: Record<string,unknown>, perform: () => Promise<T>): Promise<T> {
  assertCRMWriteAllowed(target)
  await requireOwnedOpportunity(target.session, target.locationId, target.opportunityId, target.contactId)
  const current = await highlevelRead.opportunity(target.locationId,target.opportunityId)
  const opportunity = current.opportunity || current
  const mappedUser = target.session.mappings.find(m=>m.location_id===target.locationId)?.ghl_user_id
  if(opportunity.assignedTo!==mappedUser || opportunity.contactId!==target.contactId || opportunity.locationId!==target.locationId) throw new ApiError('FORBIDDEN',403)
  const database = requireDb()
  const fingerprint = createHash('sha256').update(JSON.stringify(details)).digest('hex')
  const audit = { profile_id: target.session.profile.id, location_id: target.locationId, entity_type: 'opportunity', entity_id: target.opportunityId, action, request_json: { fingerprint }, result: 'pending', idempotency_key: target.idempotencyKey }
  const { error } = await database.from('copilot_action_audit_log').insert(audit)
  if (error) throw new ApiError(error.code === '23505' ? 'DUPLICATE_ACTION' : 'AUDIT_UNAVAILABLE', error.code === '23505' ? 409 : 503)
  try {
    const result = await perform()
    await database.from('copilot_action_audit_log').update({ result: 'confirmed', provider_result_id: (result as any)?.messageId || (result as any)?.id || null }).eq('idempotency_key', target.idempotencyKey)
    return result
  } catch (e) {
    await database.from('copilot_action_audit_log').update({ result: 'failed_or_unknown' }).eq('idempotency_key', target.idempotencyKey)
    throw e
  }
}
export async function sendMessage(target: Target, channel: 'SMS'|'Email'|'WhatsApp'|'IG'|'FB', message: string) {
  return guardedWrite(target,'send_message',{channel,message},async () => {
    const database=requireDb()
    const {data:contact}=await database.from('copilot_crm_contacts_cache').select('dnd,phone,email').eq('location_id',target.locationId).eq('contact_id',target.contactId).maybeSingle()
    if(!contact||contact.dnd)throw new ApiError('CONTACT_DND',403)
    if(channel==='SMS'&&!contact.phone)throw new ApiError('CHANNEL_UNAVAILABLE',403)
    if(channel==='Email'&&!contact.email)throw new ApiError('CHANNEL_UNAVAILABLE',403)
    const {data:preferences}=await database.from('copilot_user_preferences').select('working_hours').eq('profile_id',target.session.profile.id).maybeSingle()
    const hours=preferences?.working_hours as {timezone?:string;days?:Record<string,{start:string;end:string}>}|undefined
    if(hours?.timezone&&hours?.days){
      try{
        const parts=new Intl.DateTimeFormat('en-US',{timeZone:hours.timezone,weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date())
        const part=(name:string)=>parts.find(p=>p.type===name)?.value||''
        const slot=hours.days[part('weekday').toLowerCase()]
        const now=`${part('hour').padStart(2,'0')}:${part('minute')}`
        if(!slot||now<slot.start||now>=slot.end)throw new ApiError('OUTSIDE_WORKING_HOURS',403)
      }catch(e){if(e instanceof ApiError)throw e;throw new ApiError('WORKING_HOURS_INVALID',403)}
    }
    return ghlRequest<any>(target.locationId,'/conversations/messages',{method:'POST',body:{type:channel,contactId:target.contactId,message,status:'pending'}})
  })
}
export async function createTask(target: Target, title: string, body: string, dueDate: string) {
  const assignedTo=target.session.mappings.find(m=>m.location_id===target.locationId)?.ghl_user_id
  return guardedWrite(target,'create_task',{title,body,dueDate},() => ghlRequest<any>(target.locationId,`/contacts/${encodeURIComponent(target.contactId)}/tasks`,{method:'POST',body:{title,body,dueDate,completed:false,assignedTo}}))
}
export async function createInternalNote(target: Target, body: string) {
  return guardedWrite(target,'create_note',{body},() => ghlRequest<any>(target.locationId,`/contacts/${encodeURIComponent(target.contactId)}/notes`,{method:'POST',body:{body}}))
}
