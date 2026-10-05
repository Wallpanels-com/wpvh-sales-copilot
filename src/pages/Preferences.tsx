import { useEffect, useState } from 'react'
import { useAuth } from '../app/AuthProvider'
import { useData } from '../app/useData'
import { Avatar, Button, StateView } from '../components/ui'
import { api, errorMessage } from '../services/api'

type Day={start:string;end:string}
type Hours={timezone?:string;days?:Record<string,Day>}
type Preferences={default_workspace:'All'|'WallPanels'|'Verona Home';notifications_enabled:boolean;working_hours:Hours;signature:string}
const weekdays=['mon','tue','wed','thu','fri']
export default function Preferences(){
 const {profile}=useAuth()
 const {data,loading,error}=useData<Preferences>('/preferences')
 const [form,setForm]=useState<Preferences|null>(null),[status,setStatus]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{if(data)setForm(data)},[data])
 const timezone=form?.working_hours?.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone
 const start=form?.working_hours?.days?.mon?.start||'09:00'
 const end=form?.working_hours?.days?.mon?.end||'18:00'
 function updateHours(next:{timezone?:string;start?:string;end?:string}){
  if(!form)return
  const value={timezone:next.timezone||timezone,days:Object.fromEntries(weekdays.map(day=>[day,{start:next.start||start,end:next.end||end}]))}
  setForm({...form,working_hours:value})
 }
 async function save(){
  if(!form)return
  if(start>=end){setStatus('Working hours end must be after the start.');return}
  setBusy(true);setStatus('')
  try{await api('/preferences',{method:'PUT',body:JSON.stringify({...form,working_hours:{timezone,days:Object.fromEntries(weekdays.map(day=>[day,{start,end}]))}})});setStatus('Preferences saved.')}
  catch(e:any){setStatus(errorMessage(e.code||'DATABASE_UNAVAILABLE'))}
  finally{setBusy(false)}
 }
 return <div className="page-wrap preferences-page">
  <div className="page-intro"><div className="eyebrow eyebrow--lime">Your workspace</div><h1>Preferences</h1><p>Keep Sales Copilot tuned to the way you work.</p></div>
  <StateView loading={loading} error={error}><div className="preferences-grid">
   <div className="preference-card"><div className="card-heading"><div><span className="eyebrow">Profile</span><h2>{profile?.full_name}</h2><p>{profile?.role} · WallPanels + Verona Home</p></div><Avatar name={profile?.full_name||'User'}/></div>
    {form&&<div className="form-stack preferences-form">
     <label>Default workspace<select value={form.default_workspace} onChange={e=>setForm({...form,default_workspace:e.target.value as Preferences['default_workspace']})}><option>All</option><option>WallPanels</option><option>Verona Home</option></select></label>
     <label className="toggle-row">Notifications <input type="checkbox" checked={form.notifications_enabled} onChange={e=>setForm({...form,notifications_enabled:e.target.checked})}/></label>
     <div className="hours-grid"><label>Time zone<input value={timezone} onChange={e=>updateHours({timezone:e.target.value})} placeholder="America/New_York"/></label><label>Weekday start<input type="time" value={start} onChange={e=>updateHours({start:e.target.value})}/></label><label>Weekday end<input type="time" value={end} onChange={e=>updateHours({end:e.target.value})}/></label></div>
     <p className="login-help">Outbound messages are allowed Monday–Friday within these hours after CRM writes are enabled.</p>
     <label>Message signature<textarea rows={4} value={form.signature} onChange={e=>setForm({...form,signature:e.target.value})}/></label>
     <Button variant="primary" disabled={busy} onClick={()=>void save()}>{busy?'Saving…':'Save preferences'}</Button>{status&&<p role="status">{status}</p>}
    </div>}
   </div>
   <div className="preference-card preference-card--soft"><div className="card-heading"><div><span className="eyebrow">Your account</span><h2>Company managed access.</h2></div></div><div className="preference-list"><div><span>Role: {profile?.role}</span></div><div><span>CRM mappings and write access are managed by your administrator.</span></div></div></div>
  </div></StateView>
 </div>
}
