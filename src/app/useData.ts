import { useEffect, useState } from 'react'
import { api, type ApiFailure } from '../services/api'
export function useData<T>(path:string|null){const [data,setData]=useState<T|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null)
 useEffect(()=>{let active=true;if(!path){setLoading(false);return}setLoading(true);setError(null);api<T>(path).then(x=>{if(active)setData(x)}).catch((e:ApiFailure)=>{if(active)setError(e.code||'NETWORK_ERROR')}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[path])
 return {data,loading,error,reload:()=>{if(!path)return;setLoading(true);api<T>(path).then(x=>{setData(x);setError(null)}).catch((e:ApiFailure)=>setError(e.code||'NETWORK_ERROR')).finally(()=>setLoading(false))}}
}
