import { Bell } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWorkspace } from '../app/Workspace'
import { useData } from '../app/useData'
import { leadPath, params, type Lead } from '../services/api'

export function NotificationCenter(){
 const [open,setOpen]=useState(false),workspace=useWorkspace()
 const query=params({brand:workspace==='All'?'':workspace,attention:'needs_reply'})
 const {data,loading,error}=useData<{items:Lead[];counts:Record<string,number>}>(open?`/today?${query}`:null)
 return <div className="notifications-wrap"><button className="icon-btn notification-btn" aria-label="Notifications" aria-expanded={open} onClick={()=>setOpen(!open)}><Bell size={16}/></button>
  {open&&<div className="notifications-panel"><div className="notifications-head"><strong>Needs your reply</strong><button onClick={()=>setOpen(false)} aria-label="Close notifications">Close</button></div>
   {loading?<p>Loading…</p>:error?<p>Notifications unavailable.</p>:data?.items.length?data.items.slice(0,5).map(l=><Link key={`${l.locationId}:${l.opportunityId}`} to={leadPath(l)} onClick={()=>setOpen(false)}><strong>{l.contactName}</strong><small>{l.brand} · {l.explanation}</small></Link>):<p>Nothing needs a reply right now.</p>}
  </div>}
 </div>
}
