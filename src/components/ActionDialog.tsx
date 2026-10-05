import { useState } from 'react'
import { useAuth } from '../app/AuthProvider'
import { api, errorMessage, type Lead } from '../services/api'
import { Button, Modal, Notice } from './ui'

type Kind='message'|'task'|'note'
export function ActionDialog({lead,kind,initialText='',onClose,onDone}:{lead:Lead;kind:Kind;initialText?:string;onClose:()=>void;onDone?:(text:string)=>void}){
 const {config}=useAuth(),[text,setText]=useState(initialText),[title,setTitle]=useState(`Follow up with ${lead.contactName}`),[due,setDue]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[idempotencyKey]=useState(()=>crypto.randomUUID())
 const locked=config?.dataMode==='live'&&!config.crmWriteEnabled
 const channelAvailable=kind!=='message'||['SMS','Email','WhatsApp','IG','FB'].includes(lead.channel)
 async function submit(){if(locked||busy)return;setBusy(true);setError('');try{
   const common={locationId:lead.locationId,opportunityId:lead.opportunityId,contactId:lead.contactId}
   const body=kind==='message'?{...common,channel:lead.channel,message:text}:kind==='task'?{...common,title,body:text,dueDate:new Date(due).toISOString()}:{...common,body:text}
   await api(`/actions/${kind}`,{method:'POST',headers:{'Idempotency-Key':idempotencyKey},body:JSON.stringify(body)})
   onDone?.(text);onClose()
 }catch(e:any){setError(errorMessage(e.code||'NETWORK_ERROR'))}finally{setBusy(false)}}
 return <Modal title={kind==='message'?'Send confirmation':kind==='task'?'Create follow-up task':'Save internal note'} onClose={onClose}><div className="action-dialog"><div className="send-to"><strong>{lead.contactName}</strong><span>{lead.company} · {lead.brand} · {kind==='message'?lead.channel:'CRM'}</span></div>{kind==='task'&&<><label>Task title<input value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Due date and time<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)}/></label></>}<label>{kind==='message'?'Exact message':kind==='task'?'Task details':'Note'}<textarea rows={6} value={text} onChange={e=>setText(e.target.value)}/></label>{locked&&<Notice>CRM writes are currently locked. No message, task, or note will be sent until write access is enabled.</Notice>}{!channelAvailable&&<Notice>This contact has no supported message channel in the CRM read model.</Notice>}{config?.dataMode==='mock'&&<Notice>Mock mode: this action stays in the demonstration workspace.</Notice>}{error&&<p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" disabled={locked||busy||!channelAvailable||!text.trim()||(kind==='task'&&(!title.trim()||!due))} onClick={()=>void submit()}>{locked?'CRM writes locked':busy?'Working…':kind==='message'?'Send message':kind==='task'?'Create task':'Save note'}</Button></div></div></Modal>
}
