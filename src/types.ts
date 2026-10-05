export type Brand = 'WallPanels' | 'Verona Home'
export type Workspace = 'All' | Brand
export type Stage = 'New inquiry' | 'Qualified' | 'Estimate Sent' | 'Negotiation' | 'Won'
export type Attention = 'Needs reply' | 'Call today' | 'Follow-up due' | 'Estimate waiting' | 'Waiting for client' | 'No action needed'
export type Channel = 'SMS' | 'Email' | 'WhatsApp' | 'Instagram'

export interface User {
  id: string
  name: string
  role: 'Sales' | 'Admin'
  initials: string
  email: string
  brands: Brand[]
  preferences: {
    workspace: Workspace
    notifications: boolean
    language: string
    workingHours: string
    signature: string
  }
}

export interface Lead {
  id: string
  contactName: string
  company: string
  brand: Brand
  stage: Stage
  attention: Attention
  priority: 'High' | 'Medium' | 'Low'
  channel: Channel
  phone: string
  email: string
  project: string
  location: string
  estimate: number
  lastInteraction: string
  lastInteractionHours: number
  nextAction: string
  explanation: string
  nextAppointment?: string
  tags: string[]
  avatar: string
  color: string
  relationshipSummary: string
  draftReply: string
  recommendation: {
    title: string
    why: string
    confidence: string
  }
  callBrief?: {
    goal: string
    opening: string
    remember: string[]
    objection: string
    approach: string
  }
}

export interface Message {
  id: string
  direction: 'incoming' | 'outgoing'
  body: string
  time: string
  channel: Channel
}

export interface Conversation {
  id: string
  leadId: string
  unread: number
  status: 'Needs reply' | 'Waiting' | 'Resolved'
  snippet: string
  updated: string
  messages: Message[]
  lastCallSummary: string
  memory: string
}

export interface Call {
  id: string
  leadId: string
  date: string
  duration: string
  sentiment: 'Positive' | 'Neutral' | 'Concerned'
  followUp: 'Needs follow-up' | 'Analyzed' | 'Missed'
  summary: {
    needs: string
    objections: string
    budget: string
    timeline: string
    signals: string
    agreements: string
    nextStep: string
  }
  transcript: { time: string; speaker: string; body: string }[]
}

export interface Task {
  id: string
  leadId: string
  title: string
  due: string
  priority: 'High' | 'Medium' | 'Low'
  note: string
  done: boolean
}

export interface Estimate {
  id: string
  leadId: string
  amount: number
  status: 'Sent' | 'Draft' | 'Approved'
  sentAt: string
  version: string
}

export interface Notification {
  id: string
  title: string
  detail: string
  time: string
  kind: 'reply' | 'task' | 'estimate' | 'call'
  read: boolean
  leadId?: string
}
