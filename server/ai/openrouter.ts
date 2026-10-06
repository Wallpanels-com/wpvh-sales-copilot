import { createHash } from 'node:crypto'
import { z } from 'zod'
import { config } from '../config.js'
import { ApiError } from '../auth.js'
import { requireDb } from '../db.js'

export const attentionSchema = z.object({requires_response:z.boolean(),attention_type:z.enum(['needs_reply','call_today','follow_up_due','estimate_waiting','waiting_for_client','no_action_needed']),priority:z.enum(['high','medium','low']),reason:z.string(),confidence:z.number().min(0).max(1)})
export const actionSchema = z.object({current_situation:z.string(),next_best_action:z.string(),reason:z.string(),priority:z.enum(['high','medium','low']),suggested_channel:z.string(),should_contact_now:z.boolean()})
export const draftSchema = z.object({message:z.string().min(1)})
export const memorySchema = z.object({summary:z.string()})
export const callSummarySchema = z.object({summary:z.string(),needs:z.string(),objections:z.string(),budget:z.string(),timeline:z.string(),agreements:z.string(),nextStep:z.string(),followUp:z.string()})
export const criticSchema = z.object({relevance:z.number().min(0).max(10),continuity:z.number().min(0).max(10),tone:z.number().min(0).max(10),factuality:z.number().min(0).max(10),reply_likelihood:z.number().min(0).max(100),verdict:z.enum(['send','rewrite','drop']),reason:z.string(),fix:z.string()})
export function contextHash(value: unknown) { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }

function outputJsonSchema(schema:z.ZodType<unknown>):unknown {
  const allowed=new Set(['type','properties','required','additionalProperties','enum','anyOf','items','description'])
  const clean=(value:unknown):unknown=>{
    if(Array.isArray(value))return value.map(clean)
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([key])=>allowed.has(key)).map(([key,item])=>[key,key==='properties'&&item&&typeof item==='object'?Object.fromEntries(Object.entries(item).map(([name,property])=>[name,clean(property)])):clean(item)]))
    return value
  }
  return clean(z.toJSONSchema(schema))
}

export async function structuredAI<T>(args: { profileId:string; locationId:string; opportunityId:string; operation:string; model:'fast'|'quality'; system:string; context:unknown; schema:z.ZodType<T> }):Promise<T> {
  if (!config.aiEnabled || !config.openRouterKey) throw new ApiError('AI_UNAVAILABLE',503)
  const model = args.model==='quality'?config.aiQualityModel:config.aiFastModel
  const start=Date.now()
  const response=await fetch(`${config.openRouterBaseUrl}/chat/completions`,{
    method:'POST',headers:{Authorization:`Bearer ${config.openRouterKey}`,'Content-Type':'application/json'},
    body:JSON.stringify({model,provider:{require_parameters:true},response_format:{type:'json_schema',json_schema:{name:args.operation,strict:true,schema:outputJsonSchema(args.schema)}},messages:[{role:'system',content:args.system+' Return only a JSON object matching the supplied schema.'},{role:'user',content:JSON.stringify(args.context)}]}),
    signal:AbortSignal.timeout(30000),
  })
  if(!response.ok) {
    console.error('AI_REQUEST_FAILED',args.operation,response.status)
    throw new ApiError(response.status===429?'AI_RATE_LIMITED':'AI_UNAVAILABLE',response.status===429?429:503)
  }
  const result:any=await response.json()
  let value:unknown
  try { value=JSON.parse(result.choices?.[0]?.message?.content||'{}') }
  catch { console.error('AI_INVALID_JSON',args.operation);throw new ApiError('AI_INVALID_RESPONSE',503) }
  const parsed=args.schema.safeParse(value)
  if(!parsed.success) {
    console.error('AI_SCHEMA_MISMATCH',args.operation,parsed.error.issues.map(issue=>({path:issue.path.join('.'),code:issue.code})))
    throw new ApiError('AI_INVALID_RESPONSE',503)
  }
  await requireDb().from('copilot_ai_usage_log').insert({profile_id:args.profileId,location_id:args.locationId,opportunity_id:args.opportunityId,operation:args.operation,model,input_tokens:result.usage?.prompt_tokens||0,output_tokens:result.usage?.completion_tokens||0,estimated_cost:result.usage?.cost||null,latency_ms:Date.now()-start})
  return parsed.data
}

export async function generateDraft(args:{profileId:string;locationId:string;opportunityId:string;context:unknown}) {
  const common={profileId:args.profileId,locationId:args.locationId,opportunityId:args.opportunityId,context:args.context}
  const draft=await structuredAI({...common,operation:'draft',model:'quality',schema:draftSchema,system:'Write one concise, natural customer reply grounded only in supplied facts. Continue the actual conversation. No invented pricing, availability, or appointments. One clear question at most.'})
  const critic=await structuredAI({...common,operation:'critic',model:'fast',schema:criticSchema,system:'Evaluate the draft for relevance, continuity, tone, factuality and likelihood of reply. Score relevance, continuity, tone, and factuality from 0 to 10, where 0 is worst and 10 is best. Score reply_likelihood from 0 to 100. Set verdict send, rewrite, or drop.',context:{context:args.context,draft:draft.message}})
  if(critic.verdict==='drop') return {draft:null,critic}
  if(critic.verdict==='rewrite'||critic.factuality<8||critic.continuity<7) {
    try {
      const improved=await structuredAI({...common,operation:'rewrite',model:'quality',schema:draftSchema,system:'Improve the draft once using critic feedback. Preserve factual accuracy. Return only the improved customer message.',context:{context:args.context,draft:draft.message,critic}})
      return {draft:improved.message,critic}
    } catch { return {draft:null,critic} }
  }
  return {draft:draft.message,critic}
}
