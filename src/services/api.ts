import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'

export interface PublicConfig { supabaseUrl:string; supabaseAnonKey:string; dataMode:'mock'|'live'; crmReadEnabled:boolean; crmWriteEnabled:boolean; safeTestMode:boolean; aiEnabled:boolean }
export interface Profile { id:string; email:string; full_name:string; role:'sales'|'admin'; active:boolean }
export interface Lead { id:string; locationId:string; opportunityId:string; contactId:string; contactName:string; company:string; brand:string; pipeline:string; stage:string; attention:string; priority:string; channel:string; phone:string; email:string; estimate:number; lastInteraction:string; lastInteractionHours?:number; nextAction:string; explanation:string; relationshipSummary:string; draftReply:string; criticScore?:number|null; dnd?:boolean; project?:string; tags?:string[]; avatar?:string; color?:string; recommendation?:{title:string;why:string;confidence:string}; callBrief?:{goal:string;opening:string;remember:string[];objection:string;approach:string} }
export interface Message {id:string;direction:'incoming'|'outgoing';body:string;time:string;channel:string}
export interface Conversation {id:string;locationId:string;leadId:string;lead:Lead;unread:number;status:string;snippet:string;updated:string;messages:Message[];lastCallSummary:string;memory:string}
export interface Call {id:string;locationId:string;leadId:string;lead:Lead;date:string;duration:string|number;recordingUrl?:string|null;transcript?:{time:string;speaker:string;body:string}[]|null;summary?:Record<string,string>|null;followUp:string;sentiment?:string}
export interface Task {id:string;leadId:string;title:string;due:string;priority:string;note:string;done:boolean}
export interface LeadFilters {search?:string;brand?:string;pipeline?:string;stage?:string;attention?:string;channel?:string;priority?:string;minValue?:string;maxValue?:string;sort?:string;page?:number;limit?:number}
export interface Paged<T> {items:T[];total:number;page:number;limit:number;readLocked?:boolean;mappingMissing?:boolean}
export class ApiFailure extends Error {constructor(public code:string,public status:number){super(code)}}
let client:SupabaseClient|null=null
let currentSession:Session|null=null
export async function loadConfig():Promise<PublicConfig> {const r=await fetch('/api/public-config');if(!r.ok)throw new Error('APP_UNAVAILABLE');const c=await r.json() as PublicConfig;if(c.supabaseUrl&&c.supabaseAnonKey)client=createClient(c.supabaseUrl,c.supabaseAnonKey);return c}
export function supabase(){if(!client)throw new Error('AUTH_NOT_CONFIGURED');return client}
export function setSession(session:Session|null){currentSession=session}
export async function api<T>(path:string, options:RequestInit={}):Promise<T> {
  const token=currentSession?.access_token
  const r=await fetch(`/api${path}`,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{}) ,...options.headers}})
  if(!r.ok){let code='NETWORK_ERROR';try{code=(await r.json()).error||code}catch{}throw new ApiFailure(code,r.status)}
  return r.json() as Promise<T>
}
export const params=(x:Record<string,string|number|undefined>)=>new URLSearchParams(Object.entries(x).filter(([,v])=>v!==undefined&&v!=='').map(([k,v])=>[k,String(v)])).toString()
export function leadPath(lead:Lead){return `/leads/${encodeURIComponent(lead.locationId)}/${encodeURIComponent(lead.opportunityId)}`}
export function attentionLabel(value:string){return ({needs_reply:'Needs reply',call_today:'Call today',follow_up_due:'Follow-up due',estimate_waiting:'Estimate waiting',waiting_for_client:'Waiting for client',no_action_needed:'No action needed'} as Record<string,string>)[value]||value}
export function errorMessage(code:string){return ({UNAUTHENTICATED:'Please sign in again.',PROFILE_NOT_PROVISIONED:'Your sales profile is not ready. Please contact your administrator.',DATABASE_UNAVAILABLE:'The workspace is temporarily unavailable.',CRM_UNAVAILABLE:'CRM is temporarily unavailable.',CRM_READ_DISABLED:'Live CRM reading is locked.',WRITE_DISABLED:'CRM writes are currently locked. No message or note was sent.',TARGET_NOT_ALLOWLISTED:'This CRM record is not approved for write testing.',CONTACT_DND:'This contact has a do-not-disturb setting.',CHANNEL_UNAVAILABLE:'The selected channel is unavailable for this contact.',OUTSIDE_WORKING_HOURS:'This message is outside your configured working hours.',WORKING_HOURS_UNCONFIGURED:'Set your working hours in Preferences before sending.',FORBIDDEN:'This opportunity is not assigned to your account.',LOCATION_FORBIDDEN:'Your CRM account is not connected yet. Please contact your administrator.',AI_UNAVAILABLE:'AI is unavailable right now.',AI_RATE_LIMITED:'AI is busy. Please try again later.',RATE_LIMITED:'Too many requests. Please try again shortly.',VALIDATION_ERROR:'Please review the form values.',DUPLICATE_ACTION:'This action was already submitted.',NETWORK_ERROR:'Network error. Please try again.'} as Record<string,string>)[code]||'Something went wrong. Please try again.'}
