import { ghlRequest } from './client.js'
const q = (p: Record<string,string|number>) => new URLSearchParams(Object.entries(p).map(([k,v]) => [k,String(v)])).toString()
const enc = encodeURIComponent
export const highlevelRead = {
  users: (locationId:string) => ghlRequest<any>(locationId, `/users/?${q({locationId})}`),
  contacts: (locationId:string, id:string) => ghlRequest<any>(locationId, `/contacts/${enc(id)}`),
  opportunities: (locationId:string, assignedTo?:string, page=1) => ghlRequest<any>(locationId, `/opportunities/search?${q({locationId,status:'all',limit:100,page,...(assignedTo?{assignedTo}:{})})}`),
  opportunity: (locationId:string, id:string) => ghlRequest<any>(locationId, `/opportunities/${enc(id)}`),
  pipelines: (locationId:string) => ghlRequest<any>(locationId, `/opportunities/pipelines?${q({locationId})}`),
  conversations: (locationId:string, contactId?:string) => ghlRequest<any>(locationId, `/conversations/search?${q({locationId,...(contactId?{contactId}:{})})}`),
  messages: (locationId:string, conversationId:string) => ghlRequest<any>(locationId, `/conversations/${enc(conversationId)}/messages?limit=100`),
  transcription: (locationId:string, messageId:string) => ghlRequest<any>(locationId, `/conversations/locations/${enc(locationId)}/messages/${enc(messageId)}/transcription`),
  recording: (locationId:string, messageId:string) => ghlRequest<any>(locationId, `/conversations/messages/${enc(messageId)}/recording`),
  tasks: (locationId:string, contactId:string) => ghlRequest<any>(locationId, `/contacts/${enc(contactId)}/tasks`),
  notes: (locationId:string, contactId:string) => ghlRequest<any>(locationId, `/contacts/${enc(contactId)}/notes`),
  calendars: (locationId:string) => ghlRequest<any>(locationId, `/calendars/?${q({locationId})}`),
}
