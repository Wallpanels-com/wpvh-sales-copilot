import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { api, loadConfig, setSession, supabase, type Profile, type PublicConfig } from '../services/api'

type AuthState={config:PublicConfig|null;session:Session|null;profile:Profile|null;loading:boolean;error:string|null;signIn:(email:string,password:string)=>Promise<void>;signOut:()=>Promise<void>}
const Context=createContext<AuthState|null>(null)
export function AuthProvider({children}:{children:ReactNode}){
 const [config,setConfig]=useState<PublicConfig|null>(null),[session,setLocalSession]=useState<Session|null>(null),[profile,setProfile]=useState<Profile|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null)
 useEffect(()=>{let active=true;let unsubscribe:undefined|(()=>void)
  loadConfig().then(async c=>{if(!active)return;setConfig(c);if(!c.supabaseUrl||!c.supabaseAnonKey){setError('Authentication is not configured.');setLoading(false);return}
   const {data}=await supabase().auth.getSession();if(!active)return;setSession(data.session);setLocalSession(data.session)
   if(data.session){try{const me=await api<{profile:Profile}>('/me');if(active)setProfile(me.profile)}catch{if(active)setProfile(null)}}
   const {data:listener}=supabase().auth.onAuthStateChange((_event,next)=>{setSession(next);setLocalSession(next);if(!next)setProfile(null);else setTimeout(()=>{void api<{profile:Profile}>('/me').then(r=>{if(active)setProfile(r.profile)}).catch(()=>{if(active)setProfile(null)})},0)})
   unsubscribe=()=>listener.subscription.unsubscribe();setLoading(false)
  }).catch(()=>{if(active){setError('The application is unavailable.');setLoading(false)}})
  return()=>{active=false;unsubscribe?.()}
 },[])
 async function signIn(email:string,password:string){const {data,error}=await supabase().auth.signInWithPassword({email,password});if(error)throw error;setSession(data.session);setLocalSession(data.session);const me=await api<{profile:Profile}>('/me');setProfile(me.profile)}
 async function signOut(){await supabase().auth.signOut();setSession(null);setLocalSession(null);setProfile(null)}
 return <Context.Provider value={{config,session,profile,loading,error,signIn,signOut}}>{children}</Context.Provider>
}
export function useAuth(){const v=useContext(Context);if(!v)throw new Error('AuthProvider missing');return v}
