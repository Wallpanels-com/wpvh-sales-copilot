import type { Call, Conversation, Estimate, Lead, Notification, Task, User } from './types.js'

export const mockUser: User = {
  id: 'maria', name: 'Maria Razumna', role: 'Sales', initials: 'MR', email: 'maria@wallpanels.com', brands: ['WallPanels', 'Verona Home'],
  preferences: { workspace: 'All', notifications: true, language: 'English', workingHours: '9:00 AM – 6:00 PM', signature: 'Maria Razumna\nWallPanels + Verona Home' },
}

export const mockLeads: Lead[] = [
  {
    id: 'riverside', contactName: 'Michael Torres', company: 'Riverside Construction', brand: 'WallPanels', stage: 'Estimate Sent', attention: 'Needs reply', priority: 'High', channel: 'SMS', phone: '(305) 555-0147', email: 'michael@riverside-build.com', project: 'Commercial office wall panels', location: 'Miami, FL', estimate: 84500, lastInteraction: '2 hours ago', lastInteractionHours: 2, nextAction: 'Reply now', explanation: 'Client asked about installation 2h ago.', nextAppointment: 'Tomorrow · 11:00 AM', tags: ['Acoustic panels', 'Office fit-out'], avatar: 'MT', color: '#E5F7D7', relationshipSummary: 'Commercial office project. Client prefers oak acoustic panels. Estimate was sent five days ago. Main concern is installation timeline. Client asked today whether installation is included. Decision expected this week.', draftReply: 'Hi Michael — yes, installation is included in the estimate.\nCurrent lead time is approximately 6–8 weeks after confirmation.\nI can also send over the oak finish samples we discussed.\nWould you like both light and smoked oak?', recommendation: { title: 'Reply now', why: 'Michael asked a direct question 2 hours ago and is waiting for confirmation.', confidence: 'High' }, callBrief: { goal: 'Get an honest reaction to the estimate.', opening: 'Michael, I wanted to follow up on the office panel estimate we sent...', remember: ['Project deadline is Q3', 'Installation timing matters', 'Budget sensitivity'], objection: 'Price', approach: 'Discuss scope and options without immediately offering a discount.' },
  },
  {
    id: 'maple', contactName: 'Alyssa Chen', company: 'Maple Grove Homes', brand: 'Verona Home', stage: 'Qualified', attention: 'Call today', priority: 'High', channel: 'Email', phone: '(512) 555-0182', email: 'alyssa@maplegrovehomes.com', project: 'Custom millwork for model home', location: 'Austin, TX', estimate: 32600, lastInteraction: 'Yesterday', lastInteractionHours: 26, nextAction: 'Call today', explanation: 'Asked to reconnect after Monday. Today is the first valid day.', nextAppointment: 'Today · 3:30 PM', tags: ['Residential', 'Custom millwork'], avatar: 'AC', color: '#F3EAD4', relationshipSummary: 'Alyssa is working on a new model home and wants a warm, tailored millwork package. She liked the natural walnut direction and is comparing lead times.', draftReply: 'Hi Alyssa — today is perfect. I have a few updates on the walnut millwork lead time and would love to walk you through them.', recommendation: { title: 'Call today', why: 'Alyssa asked to reconnect after Monday. Today is the first valid day.', confidence: 'High' }, callBrief: { goal: 'Confirm material direction and decision timeline.', opening: 'Alyssa, it’s Maria from Verona Home — I wanted to pick up where we left off on the model home millwork...', remember: ['Natural walnut is the favorite', 'Model home opens in October', 'Compare lead times'], objection: 'Lead time', approach: 'Anchor on the opening date and offer two viable material paths.' },
  },
  {
    id: 'oak-stone', contactName: 'Elena Brooks', company: 'Oak & Stone Design', brand: 'WallPanels', stage: 'Estimate Sent', attention: 'Follow-up due', priority: 'Medium', channel: 'WhatsApp', phone: '(404) 555-0116', email: 'elena@oakandstone.design', project: 'Boutique hotel acoustic package', location: 'Atlanta, GA', estimate: 112800, lastInteraction: '5 days ago', lastInteractionHours: 120, nextAction: 'Review estimate', explanation: 'Estimate has been with the client for 5 days.', tags: ['Hospitality', 'Acoustic panels'], avatar: 'EB', color: '#E7ECEA', relationshipSummary: 'Elena is designing a 42-room boutique hotel. The aesthetic is high warmth with discreet acoustic performance. She needs confidence around installation sequencing before presenting to ownership.', draftReply: 'Hi Elena — wanted to make sure the hotel estimate reached you. I can also map the installation sequence room by room if that helps with your ownership review.', recommendation: { title: 'Follow up thoughtfully', why: 'The estimate has been waiting for five days and Elena is preparing an ownership review.', confidence: 'Medium' },
  },
  {
    id: 'brightline', contactName: 'Noah Patel', company: 'BrightLine Architects', brand: 'Verona Home', stage: 'Qualified', attention: 'Needs reply', priority: 'High', channel: 'Email', phone: '(212) 555-0194', email: 'noah@brightline-arch.com', project: 'Penthouse feature wall system', location: 'New York, NY', estimate: 58900, lastInteraction: '4 hours ago', lastInteractionHours: 4, nextAction: 'Reply with samples', explanation: 'Asked for smoked oak samples and a revised finish board.', tags: ['Residential', 'Finish samples'], avatar: 'NP', color: '#F1E2E9', relationshipSummary: 'Noah is selecting a finish system for a penthouse renovation. The team is aligned on the panel profile; finish and delivery are the current decision points.', draftReply: 'Hi Noah — I can send the smoked oak samples and a revised finish board today. Would you like the lighter companion sample included as well?', recommendation: { title: 'Reply with samples', why: 'Noah is actively narrowing the finish decision and asked for a concrete next step.', confidence: 'High' },
  },
  {
    id: 'cedar', contactName: 'Jordan Kim', company: 'Cedar Point Developments', brand: 'WallPanels', stage: 'Negotiation', attention: 'Estimate waiting', priority: 'Medium', channel: 'SMS', phone: '(619) 555-0173', email: 'jordan@cedarpoint.dev', project: 'Multifamily amenity lounge', location: 'San Diego, CA', estimate: 143200, lastInteraction: '3 days ago', lastInteractionHours: 72, nextAction: 'Review estimate', explanation: 'Updated estimate is ready for internal review.', tags: ['Multifamily', 'Amenity spaces'], avatar: 'JK', color: '#DFF0F3', relationshipSummary: 'Jordan is coordinating a multifamily amenity lounge with a tight handoff to procurement. Value engineering is expected, but quality and delivery still matter.', draftReply: 'Hi Jordan — the updated amenity lounge estimate is ready with the two scope options we discussed. I can walk through the trade-offs whenever your team is ready.', recommendation: { title: 'Review estimate', why: 'A revised estimate is ready and the client’s procurement review is approaching.', confidence: 'Medium' },
  },
  {
    id: 'hillside', contactName: 'Sofia Reed', company: 'Hillside Properties', brand: 'Verona Home', stage: 'New inquiry', attention: 'Waiting for client', priority: 'Low', channel: 'Instagram', phone: '(720) 555-0128', email: 'sofia@hillside-properties.com', project: 'Mountain home entry wall', location: 'Denver, CO', estimate: 18900, lastInteraction: '1 week ago', lastInteractionHours: 168, nextAction: 'Wait for client', explanation: 'Client is reviewing inspiration options before choosing a direction.', tags: ['Residential', 'Entryway'], avatar: 'SR', color: '#F0E8DC', relationshipSummary: 'Sofia is exploring a textured entry wall for a mountain home. She is early in the process and collecting inspiration before committing to a finish direction.', draftReply: 'Hi Sofia — I’m here when you’re ready to compare the entry wall directions. The inspiration board we shared is a great place to start.', recommendation: { title: 'Give space', why: 'Sofia is still collecting inspiration and has not asked for a next step yet.', confidence: 'Medium' },
  },
  {
    id: 'verde', contactName: 'Marcus Hill', company: 'Verde Commercial', brand: 'WallPanels', stage: 'Negotiation', attention: 'Follow-up due', priority: 'Medium', channel: 'SMS', phone: '(214) 555-0165', email: 'marcus@verdecommercial.com', project: 'HQ reception and boardroom', location: 'Dallas, TX', estimate: 96800, lastInteraction: '2 days ago', lastInteractionHours: 48, nextAction: 'Check in', explanation: 'Marcus mentioned an internal budget review this week.', tags: ['Commercial', 'Reception'], avatar: 'MH', color: '#E9E4F4', relationshipSummary: 'Marcus is reviewing a reception and boardroom package with finance. The team wants to maintain the visual impact while keeping the first phase within budget.', draftReply: 'Hi Marcus — checking in ahead of your budget review. I’m happy to mark up the first-phase options so the team can compare the impact clearly.', recommendation: { title: 'Check in', why: 'Marcus mentioned an internal budget review this week.', confidence: 'Medium' },
  },
  {
    id: 'lakeshore', contactName: 'Rachel West', company: 'Lakeshore Builders', brand: 'Verona Home', stage: 'Won', attention: 'No action needed', priority: 'Low', channel: 'Email', phone: '(617) 555-0109', email: 'rachel@lakeshorebuilders.com', project: 'Coastal residence millwork', location: 'Boston, MA', estimate: 72400, lastInteraction: 'Yesterday', lastInteractionHours: 28, nextAction: 'No action needed', explanation: 'Order is confirmed and installation is scheduled.', nextAppointment: 'Oct 18 · 9:00 AM', tags: ['Residential', 'Scheduled'], avatar: 'RW', color: '#E1EFDD', relationshipSummary: 'Rachel’s coastal residence package is confirmed. Installation is scheduled and the team has the final finish approvals.', draftReply: 'Hi Rachel — everything is confirmed on our side. We’ll see you on October 18 for the installation kickoff.', recommendation: { title: 'No action needed', why: 'The order is confirmed and installation is already scheduled.', confidence: 'High' },
  },
]

export const mockConversations: Conversation[] = [
  { id: 'conv-riverside', leadId: 'riverside', unread: 2, status: 'Needs reply', snippet: 'Is installation included in the estimate?', updated: '2h', lastCallSummary: 'Michael is positive on the direction; installation timeline is the main concern.', memory: 'Prefers oak acoustic panels. Decision expected this week.', messages: [
    { id: 'm1', direction: 'incoming', body: 'Hi Maria — quick question on the office panels. Is installation included in the estimate?', time: '10:42 AM', channel: 'SMS' },
    { id: 'm2', direction: 'incoming', body: 'We are trying to lock the timeline this week.', time: '10:44 AM', channel: 'SMS' },
  ] },
  { id: 'conv-brightline', leadId: 'brightline', unread: 1, status: 'Needs reply', snippet: 'Could you include smoked oak in the finish board?', updated: '4h', lastCallSummary: 'Noah is comparing finish options with the design principal tomorrow.', memory: 'Finish and delivery are the decision points.', messages: [
    { id: 'm3', direction: 'outgoing', body: 'I’ll send the current finish board over so you can compare the profiles.', time: '9:18 AM', channel: 'Email' },
    { id: 'm4', direction: 'incoming', body: 'Could you include smoked oak in the finish board?', time: '9:27 AM', channel: 'Email' },
  ] },
  { id: 'conv-maple', leadId: 'maple', unread: 0, status: 'Waiting', snippet: 'Monday works — call me after 3:00.', updated: '1d', lastCallSummary: 'Alyssa wants to keep the model home schedule intact.', memory: 'Natural walnut is the favorite; model home opens in October.', messages: [
    { id: 'm5', direction: 'incoming', body: 'Monday works — call me after 3:00.', time: 'Yesterday', channel: 'Email' },
    { id: 'm6', direction: 'outgoing', body: 'Perfect. I’ll call you Tuesday afternoon with the lead-time options.', time: 'Yesterday', channel: 'Email' },
  ] },
  { id: 'conv-oak', leadId: 'oak-stone', unread: 0, status: 'Waiting', snippet: 'I’m presenting the estimate to ownership Friday.', updated: '5d', lastCallSummary: 'Elena is preparing an ownership review and needs sequencing confidence.', memory: 'Warm, discreet acoustic performance for a boutique hotel.', messages: [
    { id: 'm7', direction: 'incoming', body: 'I’m presenting the estimate to ownership Friday.', time: 'Mon', channel: 'WhatsApp' },
    { id: 'm8', direction: 'outgoing', body: 'I can map the installation sequence before then if it would help.', time: 'Mon', channel: 'WhatsApp' },
  ] },
  { id: 'conv-verde', leadId: 'verde', unread: 0, status: 'Resolved', snippet: 'Finance is reviewing the first phase now.', updated: '2d', lastCallSummary: 'Marcus will reconnect after finance reviews the first phase.', memory: 'Protect visual impact while managing budget.', messages: [
    { id: 'm9', direction: 'incoming', body: 'Finance is reviewing the first phase now.', time: 'Tue', channel: 'SMS' },
  ] },
]

export const mockCalls: Call[] = [
  { id: 'call-riverside', leadId: 'riverside', date: 'Oct 5 · 2:12 PM', duration: '18:42', sentiment: 'Positive', followUp: 'Analyzed', summary: { needs: 'Oak acoustic panels with installation included.', objections: 'Wants confidence on lead time.', budget: '$84,500 estimate under review.', timeline: 'Q3 office opening.', signals: 'Asked for samples and installation detail.', agreements: 'Maria to confirm installation scope.', nextStep: 'Reply today; review estimate tomorrow.' }, transcript: [
    { time: '00:14', speaker: 'Maria', body: 'Tell me a little more about the office opening and the areas you want to prioritize.' },
    { time: '03:42', speaker: 'Michael', body: 'The reception and boardroom are the first phase. The oak acoustic panels felt right visually.' },
    { time: '09:06', speaker: 'Maria', body: 'We can include installation in the estimate and map the sequence with your GC.' },
    { time: '16:38', speaker: 'Michael', body: 'That helps. I want to make sure the lead time doesn’t put the Q3 opening at risk.' },
  ] },
  { id: 'call-maple', leadId: 'maple', date: 'Oct 3 · 3:20 PM', duration: '12:08', sentiment: 'Positive', followUp: 'Needs follow-up', summary: { needs: 'Natural walnut millwork for a model home.', objections: 'Lead time versus October opening.', budget: 'Around $32,600.', timeline: 'Model home opens in October.', signals: 'Asked Maria to reconnect after Monday.', agreements: 'Compare two finish paths.', nextStep: 'Call today after 3:00 PM.' }, transcript: [
    { time: '00:22', speaker: 'Alyssa', body: 'We love the warmer walnut direction, but I need to be careful with the opening date.' },
    { time: '05:01', speaker: 'Maria', body: 'I’ll bring two lead-time options so you can choose without losing the look.' },
  ] },
  { id: 'call-oak', leadId: 'oak-stone', date: 'Sep 30 · 11:05 AM', duration: '22:31', sentiment: 'Neutral', followUp: 'Needs follow-up', summary: { needs: 'Boutique hotel acoustic package.', objections: 'Installation sequencing and ownership approval.', budget: '$112,800 estimate.', timeline: 'Ownership review Friday.', signals: 'Asked for room-by-room sequencing.', agreements: 'Maria to send sequencing outline.', nextStep: 'Follow up before Friday.', }, transcript: [
    { time: '02:15', speaker: 'Elena', body: 'The material feels right. I need to make the installation story easy for ownership.' },
    { time: '11:47', speaker: 'Maria', body: 'I can make the sequence visual so the team sees exactly how the rooms roll out.' },
  ] },
]

export const mockTasks: Task[] = [
  { id: 'task-1', leadId: 'maple', title: 'Call Alyssa about lead-time options', due: 'Today · 3:30 PM', priority: 'High', note: 'Bring walnut and smoked oak alternatives.', done: false },
  { id: 'task-2', leadId: 'oak-stone', title: 'Send installation sequence outline', due: 'Tomorrow · 10:00 AM', priority: 'Medium', note: 'Make it easy for ownership to review.', done: false },
  { id: 'task-3', leadId: 'lakeshore', title: 'Confirm installation kickoff', due: 'Oct 18 · 9:00 AM', priority: 'Low', note: 'Order is already confirmed.', done: true },
]

export const mockEstimates: Estimate[] = [
  { id: 'est-riverside', leadId: 'riverside', amount: 84500, status: 'Sent', sentAt: '5 days ago', version: 'v3 · includes installation' },
  { id: 'est-maple', leadId: 'maple', amount: 32600, status: 'Draft', sentAt: 'Yesterday', version: 'v2 · walnut options' },
  { id: 'est-oak', leadId: 'oak-stone', amount: 112800, status: 'Sent', sentAt: '5 days ago', version: 'v1 · full hotel package' },
  { id: 'est-cedar', leadId: 'cedar', amount: 143200, status: 'Sent', sentAt: '3 days ago', version: 'v4 · scope options' },
]

export const mockNotifications: Notification[] = [
  { id: 'n1', title: 'New reply from Michael Torres', detail: 'Installation is the question holding up the estimate.', time: '2h ago', kind: 'reply', read: false, leadId: 'riverside' },
  { id: 'n2', title: 'Follow-up due for Oak & Stone Design', detail: 'Estimate has been waiting for 5 days.', time: '5h ago', kind: 'estimate', read: false, leadId: 'oak-stone' },
  { id: 'n3', title: 'Call task due in 20 min', detail: 'Maple Grove Homes · Alyssa Chen', time: '20m', kind: 'call', read: false, leadId: 'maple' },
  { id: 'n4', title: 'Estimate ready for review', detail: 'Cedar Point Developments · v4', time: 'Yesterday', kind: 'estimate', read: true, leadId: 'cedar' },
]

export const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
