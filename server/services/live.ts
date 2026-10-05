import { requireDb } from '../db.js'
import { requireMapping, type Session } from '../auth.js'
import { attentionOrder, classifyAttention } from './attention.js'
import { config } from '../config.js'

export interface LeadFilters { search?:string; brand?:string; pipeline?:string; stage?:string; attention?:string; channel?:string; priority?:string; minValue?:number; maxValue?:number; sort?:string; opportunityId?:string; page:number; limit:number }
export async function liveLeads(session:Session, f:LeadFilters) {
  if(!config.crmReadEnabled) return {items:[],total:0,readLocked:true}
  const database=requireDb()
  const allowed=session.mappings.filter(m=>!f.brand||m.brand===f.brand)
  if(!allowed.length) return {items:[],total:0,mappingMissing:true}
  let all:any[]=[]
  for(const mapping of allowed) {
    let query=database.from('copilot_crm_opportunities_cache').select('*').eq('location_id',mapping.location_id).eq('assigned_to',mapping.ghl_user_id).eq('status','open')
    if(f.opportunityId) query=query.eq('opportunity_id',f.opportunityId)
    const {data,error}=await query
    if(error) throw new Error('CRM_CACHE_UNAVAILABLE')
    all.push(...(data||[]).map(x=>({...x,brand:mapping.brand})))
  }
  const contacts=await Promise.all(all.map(async o=>{const {data}=await database.from('copilot_crm_contacts_cache').select('*').eq('location_id',o.location_id).eq('contact_id',o.contact_id).maybeSingle();return data}))
  const states=await Promise.all(all.map(async o=>{const {data}=await database.from('copilot_ai_lead_state').select('*').eq('location_id',o.location_id).eq('opportunity_id',o.opportunity_id).maybeSingle();return data}))
  const recent=await Promise.all(all.map(async o=>{const {data}=await database.from('copilot_crm_messages_cache').select('body,direction,created_at,user_id,channel').eq('location_id',o.location_id).eq('contact_id',o.contact_id).order('created_at',{ascending:false}).limit(16);return data||[]}))
  const openTasks=await Promise.all(all.map(async o=>{const {data}=await database.from('copilot_crm_tasks_cache').select('due_at').eq('location_id',o.location_id).eq('contact_id',o.contact_id).eq('completed',false).order('due_at',{ascending:true}).limit(1);return data?.[0]}))
  let items=all.map((o,i)=>{
    const c=contacts[i],s=states[i],messages=recent[i]
    const mapping=allowed.find(m=>m.location_id===o.location_id)
    const inbound=messages.find(m=>m.direction==='inbound'),humanOutbound=messages.find(m=>m.direction==='outbound'&&m.user_id===mapping?.ghl_user_id)
    const attention=classifyAttention({status:o.status,stageName:o.pipeline_stage_name,lastInbound:inbound?.body,lastInboundAt:inbound?.created_at,lastHumanOutboundAt:humanOutbound?.created_at,openTaskDueAt:openTasks[i]?.due_at,estimateSentAt:/estimate|proposal/i.test(o.pipeline_stage_name||'')?o.source_updated_at:null})
    const latest=messages[0]
    const channel=['SMS','Email','WhatsApp','IG','FB'].includes(latest?.channel||'')?latest.channel:'—'
    const acknowledged=attention.reason==='The latest client message is an acknowledgement.'
    return {id:o.opportunity_id,locationId:o.location_id,opportunityId:o.opportunity_id,contactId:o.contact_id,contactName:[c?.first_name,c?.last_name].filter(Boolean).join(' ')||'Unnamed contact',company:c?.company_name||o.name||'—',brand:o.brand,pipeline:o.pipeline_name||'—',stage:o.pipeline_stage_name||'—',attention:acknowledged?attention.attention_type:(s?.attention_type||attention.attention_type),priority:acknowledged?'low':s?.priority||attention.priority,channel,phone:c?.phone||'',email:c?.email||'',estimate:Number(o.monetary_value)||0,lastInteraction:latest?.created_at||o.source_updated_at||o.synced_at,nextAction:s?.next_best_action||'Review opportunity',explanation:acknowledged?attention.reason:s?.reason||attention.reason,relationshipSummary:s?.relationship_summary||'',draftReply:s?.draft_reply||'',criticScore:s?.critic_score||null,dnd:c?.dnd||false}
  })
  if(f.search)items=items.filter(x=>`${x.contactName} ${x.company} ${x.phone} ${x.email}`.toLowerCase().includes(f.search!.toLowerCase()))
  if(f.pipeline)items=items.filter(x=>x.pipeline===f.pipeline)
  if(f.stage)items=items.filter(x=>x.stage===f.stage)
  if(f.attention)items=items.filter(x=>x.attention===f.attention)
  if(f.channel)items=items.filter(x=>x.channel===f.channel)
  if(f.priority)items=items.filter(x=>x.priority===f.priority)
  if(f.minValue!==undefined)items=items.filter(x=>x.estimate>=f.minValue!)
  if(f.maxValue!==undefined)items=items.filter(x=>x.estimate<=f.maxValue!)
  items.sort((a,b)=>f.sort==='value'?b.estimate-a.estimate:f.sort==='stage'?a.stage.localeCompare(b.stage):f.sort==='recent'?Date.parse(b.lastInteraction)-Date.parse(a.lastInteraction):f.sort==='waiting'?Date.parse(a.lastInteraction)-Date.parse(b.lastInteraction):attentionOrder[a.attention as keyof typeof attentionOrder]-attentionOrder[b.attention as keyof typeof attentionOrder])
  return {items:items.slice((f.page-1)*f.limit,f.page*f.limit),total:items.length,page:f.page,limit:f.limit}
}
export async function liveOpportunity(session:Session,locationId:string,opportunityId:string) {
  const mapping=requireMapping(session,locationId)
  const {data}=await requireDb().from('copilot_crm_opportunities_cache').select('*').eq('location_id',locationId).eq('opportunity_id',opportunityId).eq('assigned_to',mapping.ghl_user_id).maybeSingle()
  if(!data)return null
  const result=await liveLeads(session,{brand:mapping.brand,opportunityId,page:1,limit:1})
  return result.items[0]||null
}
