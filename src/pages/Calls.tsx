import { Headphones, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../app/AuthProvider'
import { useData } from '../app/useData'
import { useWorkspace } from '../app/Workspace'
import { ActionDialog } from '../components/ActionDialog'
import { Avatar, Button, Empty, Pill, StateView } from '../components/ui'
import { api, errorMessage, type Call } from '../services/api'

export default function Calls(){
 const navigate=useNavigate(),{locationId,messageId}=useParams(),workspace=useWorkspace(),{config}=useAuth(),audio=useRef<HTMLAudioElement>(null)
 const brand=workspace==='All'?'':`?brand=${encodeURIComponent(workspace)}`
 const {data,loading,error}=useData<{items:Call[]}>(`/calls${brand}`)
 const [filter,setFilter]=useState('All'),[tab,setTab]=useState('Transcript'),[action,setAction]=useState<'task'|'note'|null>(null)
 const [transcripts,setTranscripts]=useState<Record<string,Call['transcript']>>({})
 const [summaries,setSummaries]=useState<Record<string,Record<string,string>>>({})
 const [aiBusy,setAiBusy]=useState(false),[aiError,setAiError]=useState('')
 const all=data?.items||[]
 const visible=all.filter(c=>filter==='All'||c.followUp===filter)
 const selected=visible.find(c=>c.id===messageId&&c.locationId===locationId)||visible[0]
 useEffect(()=>{if(selected&&(!messageId||messageId!==selected.id||locationId!==selected.locationId))navigate(`/calls/${selected.locationId}/${selected.id}`,{replace:true})},[selected?.id,selected?.locationId,messageId,locationId,navigate])
 useEffect(()=>{
  let active=true
  if(selected&&!selected.transcript&&config?.dataMode==='live'&&config.crmReadEnabled&&tab==='Transcript'){
   void api<{transcript:Call['transcript']}>(`/calls/${encodeURIComponent(selected.locationId)}/${encodeURIComponent(selected.id)}/transcription`).then(r=>{if(active)setTranscripts(v=>({...v,[selected.id]:r.transcript}))}).catch(()=>{})
  }
  return()=>{active=false}
 },[selected?.id,selected?.locationId,tab,config?.dataMode,config?.crmReadEnabled])
 const transcript=selected?.transcript||transcripts[selected?.id||'']
 const summary=selected?.summary||summaries[selected?.id||'']
 async function analyze(){
  if(!selected)return
  setAiBusy(true);setAiError('')
  try{
   const result=await api<{summary:Record<string,string>}>('/ai/call',{method:'POST',body:JSON.stringify({locationId:selected.locationId,messageId:selected.id,opportunityId:selected.leadId})})
   setSummaries(v=>({...v,[selected.id]:result.summary}))
  }catch(e:any){setAiError(errorMessage(e.code||'AI_UNAVAILABLE'))}
  finally{setAiBusy(false)}
 }
 return <div className="page-wrap page-wrap--calls">
  <div className="page-intro page-intro--split"><div><div className="eyebrow eyebrow--lime">Sales calls</div><h1>Calls</h1><p>Listen for the signal, then make the follow-up easy.</p></div><Pill><Headphones size={14}/> {all.length} recent calls</Pill></div>
  <StateView loading={loading} error={error} empty={!selected&&!loading}><div className="calls-layout">
   <aside className="calls-list"><div className="chip-row chip-row--tight">{['All','Needs follow-up','Analyzed','Missed'].map(x=><button key={x} className={`mini-filter ${filter===x?'is-active':''}`} onClick={()=>setFilter(x)}>{x}</button>)}</div>
    {visible.map(c=><button key={`${c.locationId}:${c.id}`} className={`call-row ${selected?.id===c.id?'is-active':''}`} onClick={()=>navigate(`/calls/${c.locationId}/${c.id}`)}><div className="call-row-top"><Avatar name={c.lead.contactName} color={c.lead.color}/><div><strong>{c.lead.company}</strong><small>{c.lead.contactName}</small></div><span>{c.duration||'—'}</span></div><div className="call-row-meta"><span>{c.date}</span><Pill>{c.sentiment||c.followUp}</Pill></div><div className="call-row-foot"><span>{c.followUp}</span><span>↗</span></div></button>)}
   </aside>
   {selected&&<><section className="call-detail"><div className="call-detail-head"><div><span className="eyebrow">Selected call</span><h2>{selected.lead.contactName}</h2><p>{selected.lead.company} · {selected.date} · {selected.duration}</p></div>{selected.recordingUrl?<Button onClick={()=>{void audio.current?.play()}}><Play size={15}/> Play recording</Button>:<button className="btn btn--secondary" disabled title="Recording unavailable">Recording unavailable</button>}</div>
    {selected.recordingUrl&&<audio ref={audio} controls src={selected.recordingUrl} className="audio-player"/>}
    <div className="tabs tabs--border">{['Transcript','Summary','Notes'].map(x=><button key={x} className={tab===x?'is-active':''} onClick={()=>setTab(x)}>{x}</button>)}</div>
    {tab==='Transcript'&&(transcript?.length?<div className="transcript">{transcript.map((line,i)=><div className="transcript-line" key={i}><span>{line.time}</span><strong>{line.speaker}</strong><p>{line.body}</p></div>)}</div>:<Empty title="Transcript unavailable" detail="HighLevel has no transcription for this call."/>)}
    {tab==='Summary'&&(summary?<div className="call-summary-grid">{Object.entries(summary).map(([key,value])=><div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div>:<div className="notes-area"><Empty title="No summary" detail={transcript?.length?'Analyze this transcript to prepare a factual call summary.':'A transcript is required before analysis.'}/>{config?.aiEnabled&&!!transcript?.length&&<Button disabled={aiBusy} onClick={()=>void analyze()}>{aiBusy?'Analyzing…':'Analyze call'}</Button>}{aiError&&<p className="form-error">{aiError}</p>}</div>)}
    {tab==='Notes'&&<div className="notes-area"><p>Internal notes are written to HighLevel when CRM writes are enabled.</p><Button onClick={()=>setAction('note')}>Create note</Button></div>}
   </section><aside className="call-rail"><div className="rail-card rail-card--lime"><span className="eyebrow">Next step</span><h3>{summary?.nextStep||selected.lead.nextAction}</h3><p>{selected.lead.explanation}</p><Button variant="primary" onClick={()=>setAction('task')}>Create follow-up task</Button></div><div className="rail-card"><span className="eyebrow">Call signal</span><div className="signal-score"><strong>{selected.sentiment||'Unavailable'}</strong><span>Conversation tone</span></div></div></aside></>}
  </div></StateView>
  {action&&selected&&<ActionDialog lead={selected.lead} kind={action} onClose={()=>setAction(null)}/>}
 </div>
}
