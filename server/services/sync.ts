import { config } from '../config.js'
import { requireDb } from '../db.js'
import { highlevelRead } from '../highlevel/read.js'
import { ApiError } from '../auth.js'

const database=()=>requireDb()
export function highLevelTimestamp(value: unknown): string|null {
  if(value===null||value===undefined||value==='')return null
  let date:Date
  if(typeof value==='number'&&Number.isFinite(value))date=new Date(value<100_000_000_000?value*1000:value)
  else if(typeof value==='string'&&/^\d{10,13}$/.test(value))date=new Date(value.length===10?Number(value)*1000:Number(value))
  else if(typeof value==='string')date=new Date(value)
  else return null
  return Number.isNaN(date.getTime())?null:date.toISOString()
}
export function belongsToLead(item: {contactId?:unknown; locationId?:unknown}, contactId:string, locationId:string): boolean {
  return item.contactId===contactId && item.locationId===locationId
}
async function upsert(table:string,row:Record<string,unknown>,onConflict:string) {
  const {error}=await database().from(table).upsert(row,{onConflict})
  if(error) throw new Error(`CACHE_WRITE_FAILED:${table}:${error.code||'UNKNOWN'}`)
}
async function syncLocation(locationId:string) {
  const pipelines=await highlevelRead.pipelines(locationId)
  const pmap=new Map<string,{name:string;stages:any[]}>()
  for(const p of pipelines.pipelines||[]) {
    pmap.set(p.id,{name:p.name,stages:p.stages||[]})
    await upsert('copilot_crm_pipelines_cache',{location_id:locationId,pipeline_id:p.id,name:p.name,stages:p.stages||[],synced_at:new Date().toISOString()},'location_id,pipeline_id')
  }
  const {data:mappings}=await database().from('copilot_user_ghl_mappings').select('ghl_user_id').eq('location_id',locationId)
  const users=[...new Set((mappings||[]).map(m=>m.ghl_user_id))]
  for(const userId of users) {
    for(let page=1;page<=100;page++) {
      const result=await highlevelRead.opportunities(locationId,userId,page)
      const opportunities=result.opportunities||[]
      for(const o of opportunities) {
        if(o.assignedTo!==userId) continue
        const pipeline=pmap.get(o.pipelineId)
        const stage=pipeline?.stages.find((s:any)=>s.id===o.pipelineStageId)
        await upsert('copilot_crm_opportunities_cache',{
          location_id:locationId,opportunity_id:o.id,contact_id:o.contactId,assigned_to:o.assignedTo,
          pipeline_id:o.pipelineId,pipeline_name:pipeline?.name||null,pipeline_stage_id:o.pipelineStageId,
          pipeline_stage_name:stage?.name||null,status:o.status,monetary_value:o.monetaryValue,
          name:o.name,source:o.source,source_updated_at:o.dateUpdated||null,synced_at:new Date().toISOString()
        },'location_id,opportunity_id')
        if(!o.contactId)continue
        const contactResult=await highlevelRead.contacts(locationId,o.contactId)
        const c=contactResult.contact||contactResult
        await upsert('copilot_crm_contacts_cache',{location_id:locationId,contact_id:o.contactId,first_name:c.firstName,last_name:c.lastName,email:c.email,phone:c.phone,company_name:c.companyName,dnd:!!c.dnd,source_updated_at:c.dateUpdated||null,synced_at:new Date().toISOString()},'location_id,contact_id')
        const tasks=await highlevelRead.tasks(locationId,o.contactId)
        for(const task of tasks.tasks||[])await upsert('copilot_crm_tasks_cache',{location_id:locationId,task_id:task.id,contact_id:o.contactId,assigned_to:task.assignedTo,title:task.title,body:task.body,due_at:task.dueDate,completed:!!task.completed,synced_at:new Date().toISOString()},'location_id,task_id')
        const conversations=await highlevelRead.conversations(locationId,o.contactId)
        for(const conv of conversations.conversations||[]) {
          if(!belongsToLead(conv,o.contactId,locationId))continue
          await upsert('copilot_crm_conversations_cache',{location_id:locationId,conversation_id:conv.id,contact_id:o.contactId,last_message_at:highLevelTimestamp(conv.lastMessageDate),last_message_direction:conv.lastMessageDirection||null,last_message_type:conv.lastMessageType||null,unread_count:conv.unreadCount||0,synced_at:new Date().toISOString()},'location_id,conversation_id')
          const thread=await highlevelRead.messages(locationId,conv.id)
          for(const m of thread.messages?.messages||[]) {
            if(!belongsToLead(m,o.contactId,locationId)||m.conversationId!==conv.id)continue
            await upsert('copilot_crm_messages_cache',{location_id:locationId,message_id:m.id,conversation_id:conv.id,contact_id:o.contactId,direction:m.direction,channel:m.messageType,body:m.body,user_id:m.userId||null,message_type:String(m.type??''),created_at:highLevelTimestamp(m.dateAdded)},'location_id,message_id')
            if(m.messageType==='CALL'||m.messageType==='TYPE_CALL'||m.type==='TYPE_CALL') await upsert('copilot_crm_calls_cache',{location_id:locationId,message_id:m.id,contact_id:o.contactId,conversation_id:conv.id,duration:m.meta?.callDuration||null,recording_url:typeof m.meta?.recordingUrl==='string'&&m.meta.recordingUrl.startsWith('https://')?m.meta.recordingUrl:null,transcript_status:'unknown',created_at:highLevelTimestamp(m.dateAdded)},'location_id,message_id')
          }
        }
      }
      if(opportunities.length<100)break
    }
  }
  await upsert('copilot_sync_state',{location_id:locationId,resource:'sales',last_success_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()},'location_id,resource')
}
export function startReadSync() {
  if(config.dataMode!=='live'||!config.crmReadEnabled)return
  let running=false
  const run=async()=>{
    if(running)return
    running=true
    try {
      for(const location of config.locations.filter(l=>l.locationId&&l.token)) {
        try { await syncLocation(location.locationId) }
        catch(e) {
          const code=e instanceof ApiError ? e.code : e instanceof Error && e.message.startsWith('CACHE_WRITE_FAILED:') ? e.message : 'SYNC_FAILED'
          console.error('CRM_SYNC_FAILED', location.brand, code)
          try {
            const {data:previous}=await database().from('copilot_sync_state').select('last_success_at').eq('location_id',location.locationId).eq('resource','sales').maybeSingle()
            await upsert('copilot_sync_state',{location_id:location.locationId,resource:'sales',last_success_at:previous?.last_success_at||null,last_error:code,updated_at:new Date().toISOString()},'location_id,resource')
          } catch { console.error('CRM_SYNC_STATUS_WRITE_FAILED', location.brand) }
        }
      }
    } catch { console.error('CRM_SYNC_UNEXPECTED_FAILURE') }
    finally{running=false}
  }
  void run()
  setInterval(()=>void run(),90_000).unref()
}
