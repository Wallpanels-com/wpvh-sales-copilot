import { mockCalls, mockConversations, mockLeads, mockTasks } from '../../src/data.js'
import type { LeadFilters } from './live.js'
import { attentionOrder } from './attention.js'
const locationId=(brand:string)=>brand==='WallPanels'?'mock-wallpanels':'mock-verona'
export function mockLead(lead:(typeof mockLeads)[number]) {
  return { ...lead, locationId:locationId(lead.brand),opportunityId:lead.id,contactId:`contact-${lead.id}`,
    pipeline:lead.brand==='WallPanels'?'WallPanels Sales':'Verona Home Sales',
    criticScore:8.9,dnd:false }
}
export function mockLeadsList(f:LeadFilters) {
  let list=mockLeads.filter(l=>l.stage!=='Won').map(mockLead)
  if(f.search)list=list.filter(l=>`${l.company} ${l.contactName} ${l.email} ${l.phone}`.toLowerCase().includes(f.search!.toLowerCase()))
  if(f.brand)list=list.filter(l=>l.brand===f.brand)
  if(f.pipeline)list=list.filter(l=>l.pipeline===f.pipeline)
  if(f.stage)list=list.filter(l=>l.stage===f.stage)
  if(f.attention)list=list.filter(l=>attentionKey(l.attention)===f.attention)
  if(f.channel)list=list.filter(l=>l.channel===f.channel)
  if(f.priority)list=list.filter(l=>l.priority.toLowerCase()===f.priority)
  if(f.minValue!==undefined)list=list.filter(l=>l.estimate>=f.minValue!)
  if(f.maxValue!==undefined)list=list.filter(l=>l.estimate<=f.maxValue!)
  list.sort((a,b)=>f.sort==='value'?b.estimate-a.estimate:f.sort==='stage'?a.stage.localeCompare(b.stage):f.sort==='recent'?a.lastInteractionHours-b.lastInteractionHours:f.sort==='waiting'?b.lastInteractionHours-a.lastInteractionHours:(attentionOrder[attentionKey(a.attention)]-attentionOrder[attentionKey(b.attention)])||(a.priority==='High'?-1:1))
  return {items:list.slice((f.page-1)*f.limit,f.page*f.limit),total:list.length,page:f.page,limit:f.limit}
}
function attentionKey(value:string):keyof typeof attentionOrder {return ({'Needs reply':'needs_reply','Call today':'call_today','Follow-up due':'follow_up_due','Estimate waiting':'estimate_waiting','Waiting for client':'waiting_for_client','No action needed':'no_action_needed'} as Record<string,keyof typeof attentionOrder>)[value]||'no_action_needed'}
export function mockConversationsList(brand?:string) {return mockConversations.filter(c=>!brand||mockLeads.find(l=>l.id===c.leadId)?.brand===brand).map(c=>({...c,locationId:locationId(mockLeads.find(l=>l.id===c.leadId)!.brand),lead:mockLead(mockLeads.find(l=>l.id===c.leadId)!)}))}
export function mockCallsList(brand?:string) {return mockCalls.filter(c=>!brand||mockLeads.find(l=>l.id===c.leadId)?.brand===brand).map(c=>({...c,locationId:locationId(mockLeads.find(l=>l.id===c.leadId)!.brand),lead:mockLead(mockLeads.find(l=>l.id===c.leadId)!),recordingUrl:null}))}
export function mockTasksList(leadId?:string) {return mockTasks.filter(t=>!leadId||t.leadId===leadId)}
