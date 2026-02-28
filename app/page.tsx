'use client'

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { FiMessageSquare, FiSettings, FiActivity, FiChevronRight } from 'react-icons/fi'
import { GiCastle, GiShield } from 'react-icons/gi'
import { HiSparkles } from 'react-icons/hi'
import { BsRobot } from 'react-icons/bs'

import ChatPlayground from './sections/ChatPlayground'
import AgentConfiguration from './sections/AgentConfiguration'
import ActivityMonitor from './sections/ActivityMonitor'

const LUNA_AGENT_ID = '69a27b7299680de146f8c1e2'
const RAG_ID = '69a27b54f572c99c0ffbe5b3'

const THEME_VARS = {
  '--background': '231 18% 14%',
  '--foreground': '60 30% 96%',
  '--card': '232 16% 18%',
  '--card-foreground': '60 30% 96%',
  '--primary': '265 89% 72%',
  '--primary-foreground': '60 30% 96%',
  '--accent': '135 94% 60%',
  '--accent-foreground': '231 18% 14%',
  '--muted': '228 10% 24%',
  '--muted-foreground': '228 10% 62%',
  '--border': '232 16% 28%',
  '--input': '232 16% 32%',
  '--destructive': '0 100% 62%',
  '--ring': '265 89% 72%',
  '--radius': '0.875rem',
  '--chart-1': '265 89% 72%',
  '--chart-2': '135 94% 60%',
  '--chart-3': '191 97% 67%',
  '--chart-4': '326 100% 70%',
  '--chart-5': '35 100% 60%',
  '--sidebar-background': '231 18% 11%',
  '--sidebar-foreground': '60 30% 96%',
  '--sidebar-primary': '265 89% 72%',
  '--sidebar-accent': '232 16% 22%',
  '--sidebar-border': '232 16% 24%',
} as React.CSSProperties

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

type ActiveSection = 'chat' | 'config' | 'activity'

const NAV_ITEMS: { id: ActiveSection; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { id: 'chat', label: 'Chat', icon: FiMessageSquare, desc: 'Talk with Luna' },
  { id: 'config', label: 'Config', icon: FiSettings, desc: 'Agent settings' },
  { id: 'activity', label: 'Activity', icon: FiActivity, desc: 'Monitor interactions' },
]

const AGENTS = [
  { id: LUNA_AGENT_ID, name: 'Luna Agent', purpose: 'CoC community AI', ragId: RAG_ID },
]

export default function Page() {
  const [activeSection, setActiveSection] = useState<ActiveSection>('chat')
  const [sampleMode, setSampleMode] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground flex font-sans">
        <TooltipProvider>
          {/* Sidebar */}
          <aside
            className={cn(
              'flex flex-col border-r border-border transition-all duration-300 ease-in-out flex-shrink-0',
              sidebarExpanded ? 'w-52' : 'w-[68px]'
            )}
            style={{ background: 'hsl(231 18% 11%)' }}
            onMouseEnter={() => setSidebarExpanded(true)}
            onMouseLeave={() => setSidebarExpanded(false)}
          >
            {/* Logo */}
            <div className="p-4 flex items-center gap-3 h-16 border-b border-border/50">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
                <GiShield className="w-5 h-5 text-primary" />
              </div>
              {sidebarExpanded && (
                <div className="overflow-hidden">
                  <h1 className="text-base font-bold text-foreground leading-tight">Luna</h1>
                  <p className="text-[10px] text-muted-foreground leading-tight">CoC Strategy AI</p>
                </div>
              )}
            </div>

            {/* Nav Items */}
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200',
                        activeSection === item.id
                          ? 'bg-primary/15 text-primary shadow-sm shadow-primary/10'
                          : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                      )}
                    >
                      <item.icon className={cn('w-5 h-5 flex-shrink-0', activeSection === item.id && 'drop-shadow-[0_0_6px_hsl(265,89%,72%)]')} />
                      {sidebarExpanded && (
                        <span className="truncate font-medium">{item.label}</span>
                      )}
                      {sidebarExpanded && activeSection === item.id && (
                        <FiChevronRight className="w-3.5 h-3.5 ml-auto text-primary/60" />
                      )}
                    </button>
                  </TooltipTrigger>
                  {!sidebarExpanded && (
                    <TooltipContent side="right" className="bg-card border-border text-foreground">
                      <p className="text-xs font-medium">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              ))}
            </nav>

            {/* Agent Status */}
            {sidebarExpanded && (
              <div className="p-3 border-t border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-2 px-1">Agent</p>
                {AGENTS.map((agent) => (
                  <div key={agent.id} className="flex items-center gap-2 px-2 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent shadow-sm shadow-accent/50 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs text-foreground truncate">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{agent.purpose}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collapse indicator */}
            {!sidebarExpanded && (
              <div className="p-3 border-t border-border/50 flex justify-center">
                <div className="w-2 h-2 rounded-full bg-accent shadow-sm shadow-accent/50" />
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
            {/* Top Bar */}
            <header className="h-16 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card/50">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
                    <HiSparkles className="w-4 h-4 text-primary" />
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {NAV_ITEMS.find((n) => n.id === activeSection)?.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Agent Status Badge */}
                <Badge variant="outline" className="text-xs border-accent/30 text-accent gap-1.5 hidden sm:flex">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  Luna Online
                </Badge>

                {/* Sample Data Toggle */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="sample-mode" className="text-xs text-muted-foreground cursor-pointer">
                    Sample Data
                  </Label>
                  <Switch
                    id="sample-mode"
                    checked={sampleMode}
                    onCheckedChange={setSampleMode}
                  />
                </div>
              </div>
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeSection === 'chat' && <ChatPlayground sampleMode={sampleMode} />}
              {activeSection === 'config' && <AgentConfiguration sampleMode={sampleMode} />}
              {activeSection === 'activity' && <ActivityMonitor sampleMode={sampleMode} />}
            </div>

            {/* Footer Agent Info */}
            <footer className="border-t border-border px-6 py-2 flex items-center justify-between bg-card/30 flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <BsRobot className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Luna Agent</span>
                  <span className="text-[10px] text-muted-foreground/60 font-mono">({LUNA_AGENT_ID.slice(0, 8)}...)</span>
                </div>
                <Separator orientation="vertical" className="h-3 bg-border" />
                <div className="flex items-center gap-1.5">
                  <GiCastle className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Clash of Clans Community AI</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                <span className="text-[10px] text-muted-foreground">KB Connected</span>
              </div>
            </footer>
          </main>
        </TooltipProvider>
      </div>
    </ErrorBoundary>
  )
}
