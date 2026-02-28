'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { FiSend, FiRefreshCw, FiClock } from 'react-icons/fi'
import { GiSwordman } from 'react-icons/gi'
import { HiSparkles } from 'react-icons/hi'
import { BsLightningCharge } from 'react-icons/bs'

const LUNA_AGENT_ID = '69a27b7299680de146f8c1e2'

interface ChatMessage {
  id: string
  role: 'user' | 'luna'
  content: string
  timestamp: string
  metadata?: {
    topics_discussed: string[]
    follow_up_question: string
    confidence_level: string
    kb_referenced: boolean
  }
}

interface ActivityEntry {
  id: string
  timestamp: string
  userQuery: string
  lunaResponse: string
  topics: string[]
  confidence: string
  kbUsed: boolean
  responseTime: number
}

interface ChatPlaygroundProps {
  sampleMode: boolean
}

const SAMPLE_MESSAGES: ChatMessage[] = [
  {
    id: 'sample-1',
    role: 'user',
    content: 'What is the best TH12 war attack strategy?',
    timestamp: new Date(Date.now() - 120000).toISOString(),
  },
  {
    id: 'sample-2',
    role: 'luna',
    content: '**Great question!** At TH12, the meta is heavily influenced by the Siege Barracks and Yeti compositions.\n\n### Top TH12 War Strategies:\n\n1. **Yeti Smash** - Deploy Yetis with a log launcher to core the base. Pair with bowlers and healers for cleanup.\n2. **Electro Dragon Spam** - Still effective on compact bases. Use lightning spells to take out key air defenses.\n3. **Hybrid (Hog/Miner)** - Queen charge into the base, then deploy hogs and miners for the backend.\n\n### Key Tips:\n- Always scout the base and plan your funnel\n- Bring a Siege Machine that matches your strategy\n- Practice the attack in friendly challenges first',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    metadata: {
      topics_discussed: ['TH12', 'War Strategy', 'Yeti Smash', 'Electro Dragon', 'Hybrid'],
      follow_up_question: 'Would you like me to break down the troop composition for any of these strategies?',
      confidence_level: 'high',
      kb_referenced: true,
    },
  },
  {
    id: 'sample-3',
    role: 'user',
    content: 'Tell me more about the Hybrid attack',
    timestamp: new Date(Date.now() - 30000).toISOString(),
  },
  {
    id: 'sample-4',
    role: 'luna',
    content: '**The Hybrid Attack** is one of the most versatile and powerful strategies in Clash of Clans!\n\n### Army Composition:\n- **16 Hog Riders** - Main damage dealers\n- **14 Miners** - Cleanup and tanking\n- **5 Healers** - For Queen Charge\n- **2 Baby Dragons** - Funnel support\n- **1 Archer Queen** (high level preferred)\n\n### Spell Composition:\n- 4 Heal Spells\n- 1 Rage Spell\n- 1 Poison Spell\n- 1 Freeze Spell (CC)\n\n### Execution Steps:\n1. Start with Queen Charge on the side with the enemy CC and key defenses\n2. Create a funnel with Baby Dragons\n3. Deploy King + Siege Machine to create the entry point\n4. Release Hogs and Miners together in a line behind the funnel\n5. Drop Heal Spells ahead of the pack as they move through the base',
    timestamp: new Date(Date.now() - 10000).toISOString(),
    metadata: {
      topics_discussed: ['Hybrid Attack', 'Queen Charge', 'Hog Riders', 'Miners', 'Army Composition'],
      follow_up_question: 'Want me to suggest the best base layouts where Hybrid works best?',
      confidence_level: 'high',
      kb_referenced: true,
    },
  },
]

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1.5">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1 text-foreground">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1 text-foreground">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2 text-foreground">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm text-foreground/90">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm text-foreground/90">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-foreground/90">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
  )
}

function BouncingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
      <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

export default function ChatPlayground({ sampleMode }: ChatPlaygroundProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null)
  const [statusMsg, setStatusMsg] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSessionId(crypto.randomUUID())
  }, [])

  useEffect(() => {
    if (sampleMode) {
      setMessages(SAMPLE_MESSAGES)
      setSelectedMessage(SAMPLE_MESSAGES[3])
    } else {
      setMessages([])
      setSelectedMessage(null)
    }
  }, [sampleMode])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const handleSend = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)
    setStatusMsg('')

    const startTime = Date.now()

    try {
      const result = await callAIAgent(trimmed, LUNA_AGENT_ID, { session_id: sessionId })
      const elapsedMs = Date.now() - startTime

      if (result.success) {
        const agentResult = result.response?.result || {}
        const responseText = agentResult.response || result.response?.message || 'Luna could not generate a response.'
        const topicsDiscussed = Array.isArray(agentResult.topics_discussed) ? agentResult.topics_discussed : []
        const followUpQuestion = agentResult.follow_up_question || ''
        const confidenceLevel = agentResult.confidence_level || 'medium'
        const kbReferenced = agentResult.kb_referenced === true

        const lunaMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'luna',
          content: responseText,
          timestamp: new Date().toISOString(),
          metadata: {
            topics_discussed: topicsDiscussed,
            follow_up_question: followUpQuestion,
            confidence_level: confidenceLevel,
            kb_referenced: kbReferenced,
          },
        }
        setMessages(prev => [...prev, lunaMsg])
        setSelectedMessage(lunaMsg)

        // Save to activity log in localStorage
        const activityEntry: ActivityEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          userQuery: trimmed.substring(0, 100),
          lunaResponse: responseText.substring(0, 100),
          topics: topicsDiscussed,
          confidence: confidenceLevel,
          kbUsed: kbReferenced,
          responseTime: elapsedMs,
        }
        try {
          const existing = JSON.parse(localStorage.getItem('luna_activity_log') || '[]')
          const updated = Array.isArray(existing) ? existing : []
          updated.unshift(activityEntry)
          localStorage.setItem('luna_activity_log', JSON.stringify(updated.slice(0, 500)))
        } catch {
          // localStorage may be unavailable
        }
      } else {
        setStatusMsg('Failed to get response from Luna. Please try again.')
      }
    } catch {
      setStatusMsg('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [inputValue, isLoading, sessionId])

  const handleReset = () => {
    setMessages([])
    setSelectedMessage(null)
    setSessionId(crypto.randomUUID())
    setStatusMsg('Conversation reset. New session started.')
    setTimeout(() => setStatusMsg(''), 3000)
  }

  const confidenceColor = (level: string) => {
    if (level === 'high') return 'bg-accent/20 text-accent border-accent/30'
    if (level === 'low') return 'bg-destructive/20 text-destructive border-destructive/30'
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }

  const displayMessages = messages

  return (
    <div className="flex gap-4 h-full">
      {/* Chat Area - 70% */}
      <div className="flex-[7] flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GiSwordman className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Chat with Luna</h2>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">Session Active</Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="border-border hover:bg-primary/10 hover:text-primary">
            <FiRefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset
          </Button>
        </div>

        {/* Messages */}
        <Card className="flex-1 min-h-0 bg-card border-border shadow-xl shadow-black/20">
          <div ref={scrollRef} className="h-[calc(100vh-320px)] overflow-y-auto p-4 space-y-4">
            {displayMessages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
                  <GiSwordman className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Welcome, Chief!</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                  Ask Luna anything about Clash of Clans - attack strategies, base building, troop compositions, clan management, and more.
                </p>
              </div>
            )}

            {displayMessages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'luna' && (
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/10">
                    <GiSwordman className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-4 py-3 cursor-pointer transition-all duration-200',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'bg-card border border-border shadow-lg shadow-black/10 hover:shadow-primary/5'
                  )}
                  onClick={() => msg.metadata && setSelectedMessage(msg)}
                >
                  {msg.role === 'luna' ? renderMarkdown(msg.content) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                  <div className={cn('flex items-center gap-1 mt-2 text-[10px]', msg.role === 'user' ? 'text-primary-foreground/60 justify-end' : 'text-muted-foreground')}>
                    <FiClock className="w-2.5 h-2.5" />
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <GiSwordman className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <div className="bg-card border border-border rounded-2xl shadow-lg shadow-black/10">
                  <BouncingDots />
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Status message */}
        {statusMsg && (
          <p className="text-xs text-muted-foreground mt-1 px-1">{statusMsg}</p>
        )}

        {/* Input */}
        <div className="flex gap-2 mt-3">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask Luna about Clash of Clans..."
            className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground focus:ring-primary/50"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/40"
          >
            <FiSend className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Context Panel - 30% */}
      <div className="flex-[3] flex flex-col min-h-0">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
          <HiSparkles className="w-4 h-4 text-primary" />
          Response Context
        </h3>

        <Card className="flex-1 bg-card border-border shadow-xl shadow-black/20 overflow-y-auto">
          <CardContent className="p-4 space-y-4">
            {selectedMessage?.metadata ? (
              <>
                {/* Confidence */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Confidence</p>
                  <Badge variant="outline" className={cn('text-xs border capitalize', confidenceColor(selectedMessage.metadata.confidence_level))}>
                    <BsLightningCharge className="w-3 h-3 mr-1" />
                    {selectedMessage.metadata.confidence_level}
                  </Badge>
                </div>

                <Separator className="bg-border" />

                {/* KB Referenced */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Knowledge Base</p>
                  <div className="flex items-center gap-2">
                    <div className={cn('w-2.5 h-2.5 rounded-full', selectedMessage.metadata.kb_referenced ? 'bg-accent shadow-sm shadow-accent/50' : 'bg-muted-foreground/30')} />
                    <span className="text-sm text-foreground">
                      {selectedMessage.metadata.kb_referenced ? 'KB Referenced' : 'No KB Used'}
                    </span>
                  </div>
                </div>

                <Separator className="bg-border" />

                {/* Topics */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Topics Discussed</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.isArray(selectedMessage.metadata.topics_discussed) && selectedMessage.metadata.topics_discussed.length > 0 ? (
                      selectedMessage.metadata.topics_discussed.map((topic, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20 border">
                          {topic}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No topics identified</p>
                    )}
                  </div>
                </div>

                {/* Follow-up */}
                {selectedMessage.metadata.follow_up_question && (
                  <>
                    <Separator className="bg-border" />
                    <div>
                      <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wider">Suggested Follow-up</p>
                      <button
                        onClick={() => {
                          setInputValue(selectedMessage.metadata?.follow_up_question || '')
                        }}
                        className="w-full text-left p-2.5 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors text-sm text-foreground cursor-pointer"
                      >
                        {selectedMessage.metadata.follow_up_question}
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <HiSparkles className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Send a message to see response context details here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
