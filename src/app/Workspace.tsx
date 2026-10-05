import { createContext, useContext, type ReactNode } from 'react'

export type Workspace = 'All' | 'WallPanels' | 'Verona Home'
const Context=createContext<Workspace>('All')
export function WorkspaceScope({workspace,children}:{workspace:Workspace;children:ReactNode}){return <Context.Provider value={workspace}>{children}</Context.Provider>}
export function useWorkspace(){return useContext(Context)}
