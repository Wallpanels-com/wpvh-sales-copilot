import Fastify from 'fastify'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import { config } from './config.js'
import { ApiError, requireOwnedOpportunity, sessionFromRequest } from './auth.js'
import { db, requireDb, userDb } from './db.js'
import { mockCallsList, mockConversationsList, mockLead, mockLeadsList, mockTasksList } from './services/mock.js'
import { liveLeads, liveOpportunity } from './services/live.js'
import { mockLeads } from '../src/data.js'
import { startReadSync } from './services/sync.js'
import { createInternalNote, createTask, sendMessage } from './highlevel/write.js'
import { generateDraft, structuredAI, actionSchema, attentionSchema, memorySchema, contextHash } from './ai/openrouter.js'
import { classifyAttention } from './services/attention.js'
import { highlevelRead } from './highlevel/read.js'

const app=Fastify({logger:false,bodyLimit:32_768,trustProxy:true})
await app.register(helmet,{contentSecurityPolicy:false})
await app.register(rateLimit,{max:120,timeWindow:'1 minute'})
app.setErrorHandler((error,_request,reply)=>{
  const e=error instanceof ApiError?error:new ApiError('INTERNAL_ERROR',500)
  reply.code(e.status).send({error:e.code})
})
app.get('/api/health',async()=>({ok:true}))
app.get('/api/public-config',async()=>({supabaseUrl:config.supabaseUrl,supabaseAnonKey:config.supabaseAnonKey,dataMode:config.dataMode,crmReadEnabled:config.crmReadEnabled,crmWriteEnabled:config.crmWriteEnabled,safeTestMode:config.safeTestMode,aiEnabled:config.aiEnabled}))
const auth={preHandler:async(request:any)=>{request.session=await sessionFromRequest(request)}}
const session=(request:any)=>request.session as Awaited<ReturnType<typeof sessionFromRequest>>
const personalDb=(request:any)=>db||userDb(String(request.headers.authorization||'').replace(/^Bearer /i,''))
const listSchema=z.object({search:z.string().max(120).optional(),brand:z.string().optional(),pipeline:z.string().optional(),stage:z.string().optional(),attention:z.string().optional(),channel:z.string().optional(),priority:z.string().optional(),minValue:z.coerce.number().optional(),maxValue:z.coerce.number().optional(),sort:z.string().optional(),page:z.coerce.number().int().min(1).default(1),limit:z.coerce.number().int().min(1).max(50).default(20)})
const pathSchema=z.object({locationId:z.string().min(1).max(100),opportunityId:z.string().min(1).max(100)})
app.get('/api/me',auth,async(request)=>({profile:session(request).profile,mappings:session(request).mappings}))
app.get('/api/leads',auth,async(request)=>{
  const f=listSchema.parse(request.query)
  return config.dataMode==='mock'?mockLeadsList(f):liveLeads(session(request),f)
})
app.get('/api/leads/:locationId/:opportunityId',auth,async(request)=>{
  const p=pathSchema.parse(request.params)
  if(config.dataMode==='mock'){
    const l=mockLeads.find(x=>x.id===p.opportunityId)
    if(!l||mockLead(l).locationId!==p.locationId)throw new ApiError('NOT_FOUND',404)
    return mockLead(l)
  }
  const o=await liveOpportunity(session(request),p.locationId,p.opportunityId)
  if(!o)throw new ApiError('NOT_FOUND',404)
  return o
})
app.get('/api/conversations',auth,async(request)=>{
  const brand=(request.query as any)?.brand as string|undefined
  if(config.dataMode==='mock')return {items:mockConversationsList(brand)}
  if(!config.crmReadEnabled)return {items:[],readLocked:true}
  const leads=await liveLeads(session(request),{page:1,limit:50})
  const items=[]
  for(const lead of leads.items){
    const {data}=await requireDb().from('copilot_crm_conversations_cache').select('*').eq('location_id',lead.locationId).eq('contact_id',lead.contactId)
    for(const c of data||[]){
      const {data:messages}=await requireDb().from('copilot_crm_messages_cache').select('*').eq('location_id',lead.locationId).eq('conversation_id',c.conversation_id).order('created_at',{ascending:true}).limit(50)
      items.push({id:c.conversation_id,locationId:lead.locationId,leadId:lead.opportunityId,lead,unread:c.unread_count,status:lead.attention,snippet:messages?.at(-1)?.body||'',updated:c.last_message_at,messages:(messages||[]).map(m=>({id:m.message_id,direction:m.direction==='inbound'?'incoming':'outgoing',body:m.body||'',time:m.created_at,channel:m.channel})),lastCallSummary:'',memory:lead.relationshipSummary})
    }
  }
  return {items}
})
app.get('/api/calls',auth,async(request)=>{
  const brand=(request.query as any)?.brand as string|undefined
  if(config.dataMode==='mock')return {items:mockCallsList(brand)}
  if(!config.crmReadEnabled)return {items:[],readLocked:true}
  const leads=await liveLeads(session(request),{page:1,limit:50})
  const items=[]
  for(const lead of leads.items){
    const {data}=await requireDb().from('copilot_crm_calls_cache').select('*').eq('location_id',lead.locationId).eq('contact_id',lead.contactId).order('created_at',{ascending:false}).limit(20)
    for(const c of data||[])items.push({id:c.message_id,locationId:lead.locationId,leadId:lead.opportunityId,lead,date:c.created_at,duration:c.duration,recordingUrl:c.recording_url,transcript:c.transcript||null,summary:null,followUp:'Analyzed'})
  }
  return {items}
})
app.get('/api/calls/:locationId/:messageId/transcription',auth,async(request)=>{
  const p=z.object({locationId:z.string(),messageId:z.string()}).parse(request.params)
  const {data:call}=await requireDb().from('copilot_crm_calls_cache').select('*').eq('location_id',p.locationId).eq('message_id',p.messageId).maybeSingle()
  if(!call)throw new ApiError('NOT_FOUND',404)
  const {data:owned}=await requireDb().from('copilot_crm_opportunities_cache').select('opportunity_id,assigned_to').eq('location_id',p.locationId).eq('contact_id',call.contact_id)
  if(!(owned||[]).some(o=>session(request).mappings.some(m=>m.location_id===p.locationId&&m.ghl_user_id===o.assigned_to)))throw new ApiError('FORBIDDEN',403)
  if(call.transcript)return {transcript:call.transcript}
  if(!config.crmReadEnabled)throw new ApiError('CRM_READ_DISABLED',423)
  try{return {transcript:await highlevelRead.transcription(p.locationId,p.messageId)}}catch{return {transcript:null}}
})
app.get('/api/tasks',auth,async(request)=>{
  const leadId=(request.query as any)?.leadId as string|undefined
  if(config.dataMode==='mock')return {items:mockTasksList(leadId)}
  if(!config.crmReadEnabled)return {items:[],readLocked:true}
  const leads=await liveLeads(session(request),{page:1,limit:50})
  const allowed=leadId?leads.items.filter(l=>l.opportunityId===leadId):leads.items
  const items=[]
  for(const lead of allowed){const {data}=await requireDb().from('copilot_crm_tasks_cache').select('*').eq('location_id',lead.locationId).eq('contact_id',lead.contactId);items.push(...(data||[]).map(t=>({id:t.task_id,leadId:lead.opportunityId,title:t.title,due:t.due_at,priority:'Medium',note:t.body,done:t.completed})))}
  return {items}
})
const writeTarget=z.object({locationId:z.string().min(1),opportunityId:z.string().min(1),contactId:z.string().min(1)})
const messageSchema=writeTarget.extend({channel:z.enum(['SMS','Email','WhatsApp','IG','FB']),message:z.string().min(1).max(5000)})
const taskSchema=writeTarget.extend({title:z.string().min(1).max(200),body:z.string().max(3000),dueDate:z.iso.datetime()})
const noteSchema=writeTarget.extend({body:z.string().min(1).max(5000)})
function target(request:any,body:{locationId:string;opportunityId:string;contactId:string}){
  return {session:session(request),...body,idempotencyKey:String(request.headers['idempotency-key']||'')}
}
app.post('/api/actions/message',{...auth,config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async(request)=>{
  const body=messageSchema.parse(request.body)
  if(config.dataMode==='mock')return {mock:true,id:crypto.randomUUID()}
  return sendMessage(target(request,body),body.channel,body.message)
})
app.post('/api/actions/task',{...auth,config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async(request)=>{
  const body=taskSchema.parse(request.body)
  if(config.dataMode==='mock')return {mock:true,id:crypto.randomUUID()}
  return createTask(target(request,body),body.title,body.body,body.dueDate)
})
app.post('/api/actions/note',{...auth,config:{rateLimit:{max:10,timeWindow:'1 minute'}}},async(request)=>{
  const body=noteSchema.parse(request.body)
  if(config.dataMode==='mock')return {mock:true,id:crypto.randomUUID()}
  return createInternalNote(target(request,body),body.body)
})
app.post('/api/lessons',auth,async(request)=>{
  const body=z.object({kind:z.enum(['message_style','follow_up','call_brief','global']),scope:z.enum(['user','company']).default('user'),lesson:z.string().trim().min(1).max(500)}).parse(request.body)
  if(body.scope==='company'&&session(request).profile.role!=='admin')throw new ApiError('FORBIDDEN',403)
  if(body.scope==='company'&&!db)throw new ApiError('DATABASE_UNAVAILABLE',503)
  const {error}=await personalDb(request).from('copilot_ai_lessons').insert({profile_id:body.scope==='user'?session(request).profile.id:null,...body})
  if(error)throw new ApiError('DATABASE_UNAVAILABLE',503)
  return {saved:true}
})
app.get('/api/preferences',auth,async(request)=>{
  const {data}=await personalDb(request).from('copilot_user_preferences').select('*').eq('profile_id',session(request).profile.id).maybeSingle()
  return data||{default_workspace:'All',notifications_enabled:true,working_hours:{},signature:''}
})
app.put('/api/preferences',auth,async(request)=>{
  const body=z.object({default_workspace:z.enum(['All','WallPanels','Verona Home']),notifications_enabled:z.boolean(),working_hours:z.record(z.string(),z.unknown()),signature:z.string().max(1000)}).parse(request.body)
  const {error}=await personalDb(request).from('copilot_user_preferences').upsert({profile_id:session(request).profile.id,...body})
  if(error)throw new ApiError('DATABASE_UNAVAILABLE',503)
  return {saved:true}
})
app.post('/api/ai/lead',auth,async(request)=>{
  const p=pathSchema.parse(request.body)
  if(config.dataMode==='mock')throw new ApiError('AI_UNAVAILABLE',503)
  const o=await requireOwnedOpportunity(session(request),p.locationId,p.opportunityId)
  const {data:contact}=await requireDb().from('copilot_crm_contacts_cache').select('*').eq('location_id',p.locationId).eq('contact_id',o.contact_id).maybeSingle()
  const {data:messages}=await requireDb().from('copilot_crm_messages_cache').select('body,direction,created_at,user_id,channel').eq('location_id',p.locationId).eq('contact_id',o.contact_id).order('created_at',{ascending:false}).limit(16)
  const {data:prior}=await requireDb().from('copilot_ai_lead_state').select('*').eq('location_id',p.locationId).eq('opportunity_id',p.opportunityId).maybeSingle()
  const context={contact:{firstName:contact?.first_name,lastName:contact?.last_name,company:contact?.company_name,dnd:contact?.dnd},opportunity:{name:o.name,stage:o.pipeline_stage_name,value:o.monetary_value},messages:messages||[],relationshipSummary:prior?.relationship_summary||''}
  const hash=contextHash(context)
  if(prior?.context_hash===hash)return {cached:true,state:prior}
  const mapped=session(request).mappings.find(m=>m.location_id===p.locationId)
  const newestInbound=(messages||[]).find(m=>m.direction==='inbound')
  const newestHumanOutbound=(messages||[]).find(m=>m.direction==='outbound'&&m.user_id===mapped?.ghl_user_id)
  const deterministic=classifyAttention({status:o.status,stageName:o.pipeline_stage_name,lastInbound:newestInbound?.body,lastInboundAt:newestInbound?.created_at,lastHumanOutboundAt:newestHumanOutbound?.created_at})
  const aiCommon={profileId:session(request).profile.id,locationId:p.locationId,opportunityId:p.opportunityId}
  const [action,attention,memory]=await Promise.all([
    structuredAI({...aiCommon,operation:'next_action',model:'fast',schema:actionSchema,system:'Suggest the next sales action using only supplied facts. Do not infer permission to contact.',context}),
    structuredAI({...aiCommon,operation:'attention',model:'fast',schema:attentionSchema,system:'Classify sales attention from supplied facts. A simple thank you or acknowledgement usually needs no reply. Automated outbound is not a human response. Respect deterministic classification when explicit.',context:{...context,deterministic}}),
    structuredAI({...aiCommon,operation:'relationship_memory',model:'fast',schema:memorySchema,system:'Update a concise factual relationship summary. Include only evidenced needs, objections, agreements, timing, and next step. Do not invent facts.',context}),
  ])
  const draft=action.should_contact_now?await generateDraft({profileId:session(request).profile.id,locationId:p.locationId,opportunityId:p.opportunityId,context}):{draft:null,critic:null}
  const acknowledged=deterministic.reason==='The latest client message is an acknowledgement.'
  const state={location_id:p.locationId,opportunity_id:p.opportunityId,contact_id:o.contact_id,context_hash:hash,attention_type:acknowledged?'waiting_for_client':attention.attention_type,priority:acknowledged?'low':attention.priority,requires_response:acknowledged?false:attention.requires_response,relationship_summary:memory.summary,current_situation:action.current_situation,next_best_action:action.next_best_action,reason:acknowledged?deterministic.reason:attention.reason||action.reason,draft_reply:draft.draft,critic_score:draft.critic?.factuality||null,critic_json:draft.critic,model_used:config.aiFastModel,generated_at:new Date().toISOString()}
  await requireDb().from('copilot_ai_lead_state').upsert(state,{onConflict:'location_id,opportunity_id'})
  return {cached:false,state}
})
const staticRoot=join(fileURLToPath(new URL('..',import.meta.url)),'dist')
await app.register(fastifyStatic,{root:staticRoot,prefix:'/'})
app.setNotFoundHandler((request,reply)=>{
  if(request.url.startsWith('/api/'))return reply.code(404).send({error:'NOT_FOUND'})
  return reply.sendFile('index.html')
})
startReadSync()
await app.listen({port:config.port,host:'0.0.0.0'})
