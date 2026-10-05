export type AttentionType = 'needs_reply'|'call_today'|'follow_up_due'|'estimate_waiting'|'waiting_for_client'|'no_action_needed'
export type Priority = 'high'|'medium'|'low'
export interface AttentionFacts {
  lastInbound?: string | null
  lastInboundAt?: string | null
  lastHumanOutboundAt?: string | null
  openTaskDueAt?: string | null
  stageName?: string | null
  status?: string | null
  hasScheduledCall?: boolean
  estimateSentAt?: string | null
}
export interface AttentionResult { attention_type: AttentionType; priority: Priority; requires_response: boolean; reason: string; confidence: number }
const ack = /^(?:thanks(?: you)?[!.\s]*|got it[!.\s]*|sounds good[!.\s]*|perfect(?:,? thank you)?[!.\s]*|great,? see you then[!.\s]*|👍+|ok(?:ay)?[!.\s]*)$/i
const request = /\?|\b(?:can you|could you|would you|please|need|when|what|how|is installation|send me|let me know|call me|quote|estimate)\b/i
const after = (a?:string|null,b?:string|null) => !!a && (!b || Date.parse(a)>Date.parse(b))
export function classifyAttention(f: AttentionFacts, now = new Date()): AttentionResult {
  if (f.status && ['won','lost','abandoned','closed'].includes(f.status.toLowerCase())) return {attention_type:'no_action_needed',priority:'low',requires_response:false,reason:'Opportunity is closed.',confidence:1}
  const due = f.openTaskDueAt && Date.parse(f.openTaskDueAt)<=now.getTime()
  if (after(f.lastInboundAt,f.lastHumanOutboundAt) && f.lastInbound?.trim() && request.test(f.lastInbound.trim()) && !ack.test(f.lastInbound.trim()))
    return {attention_type:'needs_reply',priority:'high',requires_response:true,reason:'A client message is awaiting a human response.',confidence:0.8}
  if (due) return {attention_type:'follow_up_due',priority:'high',requires_response:false,reason:'A follow-up task is due.',confidence:0.95}
  if (f.hasScheduledCall) return {attention_type:'call_today',priority:'high',requires_response:false,reason:'A call is scheduled today.',confidence:0.95}
  if (f.estimateSentAt && Date.parse(f.estimateSentAt)<now.getTime()-3*86400000) return {attention_type:'estimate_waiting',priority:'medium',requires_response:false,reason:'An estimate has been waiting for review.',confidence:0.7}
  if (after(f.lastInboundAt,f.lastHumanOutboundAt) && ack.test(f.lastInbound?.trim()||''))
    return {attention_type:'waiting_for_client',priority:'low',requires_response:false,reason:'The latest client message is an acknowledgement.',confidence:0.85}
  if (after(f.lastInboundAt,f.lastHumanOutboundAt) && f.lastInbound?.trim())
    return {attention_type:'follow_up_due',priority:'medium',requires_response:false,reason:'Recent client message needs human review before deciding whether to reply.',confidence:0.4}
  if (f.lastHumanOutboundAt) return {attention_type:'waiting_for_client',priority:'low',requires_response:false,reason:'Waiting for the client after a human response.',confidence:0.7}
  return {attention_type:'no_action_needed',priority:'low',requires_response:false,reason:'No current action is identified.',confidence:0.45}
}
export const attentionOrder: Record<AttentionType,number> = {needs_reply:0,follow_up_due:1,call_today:2,estimate_waiting:3,waiting_for_client:4,no_action_needed:5}
