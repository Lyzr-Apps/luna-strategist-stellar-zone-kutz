'use client'

import { useState } from 'react'
import { crawlWebsite } from '@/lib/ragKnowledgeBase'
import { KnowledgeBaseUpload } from '@/components/KnowledgeBaseUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { FiShield, FiHeart, FiUsers, FiCpu, FiDatabase, FiGlobe, FiBookOpen, FiCheck, FiX, FiZap } from 'react-icons/fi'
import { GiCastle } from 'react-icons/gi'
import { HiSparkles } from 'react-icons/hi'
import { BsRobot } from 'react-icons/bs'

const RAG_ID = '69a27b54f572c99c0ffbe5b3'

interface AgentConfigurationProps {
  sampleMode: boolean
}

const PERSONALITY_RULES = [
  {
    icon: FiShield,
    title: 'Anti-Hallucination + Live Search',
    desc: 'Luna uses real-time web search to verify all game facts. Never fabricates data — always grounded in the latest sources.',
    color: 'text-primary',
  },
  {
    icon: FiHeart,
    title: 'Engagement Style',
    desc: '40% of responses include follow-up questions to keep conversations flowing and deepen strategy discussions.',
    color: 'text-destructive',
  },
  {
    icon: FiUsers,
    title: 'Community Values',
    desc: 'No favoritism toward clans or players. No shaming for skill levels. Welcoming to all Town Hall tiers.',
    color: 'text-accent',
  },
  {
    icon: FiBookOpen,
    title: 'Expert Knowledge',
    desc: 'Deep understanding of attack strategies, base building, troop compositions, clan wars, and meta shifts.',
    color: 'hsl(var(--chart-4))',
  },
]

const MODEL_SETTINGS = [
  { label: 'Model', value: 'Perplexity sonar-pro', progress: 100 },
  { label: 'Temperature', value: '0.65', progress: 65 },
  { label: 'Top P', value: '0.92', progress: 92 },
  { label: 'Web Search', value: 'Built-in', progress: 100 },
]

export default function AgentConfiguration({ sampleMode }: AgentConfigurationProps) {
  const [crawlUrl, setCrawlUrl] = useState('')
  const [crawlStatus, setCrawlStatus] = useState('')
  const [isCrawling, setIsCrawling] = useState(false)

  const handleCrawl = async () => {
    if (!crawlUrl.trim()) return
    setIsCrawling(true)
    setCrawlStatus('Crawling website...')
    try {
      await crawlWebsite(RAG_ID, crawlUrl.trim())
      setCrawlStatus('Website content added to knowledge base successfully!')
      setCrawlUrl('')
    } catch {
      setCrawlStatus('Failed to crawl website. Please check the URL and try again.')
    } finally {
      setIsCrawling(false)
      setTimeout(() => setCrawlStatus(''), 5000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <BsRobot className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Agent Configuration</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personality & Rules */}
        <Card className="bg-card border-border shadow-xl shadow-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HiSparkles className="w-4 h-4 text-primary" />
              Personality & Rules
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Core behavioral guidelines that define Luna&apos;s responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PERSONALITY_RULES.map((rule, idx) => (
              <div key={idx} className="flex gap-3 p-3 rounded-xl bg-background/50 border border-border/50 hover:border-primary/20 transition-colors">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10')}>
                  <rule.icon className={cn('w-4 h-4', rule.color)} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{rule.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Model Settings */}
        <Card className="bg-card border-border shadow-xl shadow-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FiCpu className="w-4 h-4 text-primary" />
              Model Settings
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Current LLM configuration (read-only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {MODEL_SETTINGS.map((setting, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{setting.label}</span>
                  <Badge variant="outline" className="text-xs border-border font-mono">{setting.value}</Badge>
                </div>
                <Progress value={setting.progress} className="h-1.5" />
              </div>
            ))}

            <Separator className="bg-border my-3" />

            {/* Memory Settings */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FiZap className="w-4 h-4 text-accent" />
                <p className="text-sm font-medium text-foreground">Memory Settings</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
                  <span className="text-sm text-muted-foreground">Conversation Memory</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent shadow-sm shadow-accent/50" />
                    <span className="text-xs text-accent font-medium">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
                  <span className="text-sm text-muted-foreground">Context Mode</span>
                  <Badge variant="outline" className="text-xs border-border">Session-based</Badge>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
                  <span className="text-sm text-muted-foreground">Knowledge Base</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-accent shadow-sm shadow-accent/50" />
                    <span className="text-xs text-accent font-medium">Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Knowledge Base Upload */}
        <Card className="bg-card border-border shadow-xl shadow-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FiDatabase className="w-4 h-4 text-primary" />
              Knowledge Base
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Upload CoC strategy documents, guides, and reference material
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KnowledgeBaseUpload ragId={RAG_ID} />
          </CardContent>
        </Card>

        {/* Web Crawl */}
        <Card className="bg-card border-border shadow-xl shadow-black/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FiGlobe className="w-4 h-4 text-primary" />
              Web Content Crawler
            </CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              Add web content to Luna&apos;s knowledge base by URL
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={crawlUrl}
                onChange={(e) => setCrawlUrl(e.target.value)}
                placeholder="https://clashofclans.fandom.com/..."
                className="flex-1 bg-input border-border text-foreground placeholder:text-muted-foreground"
                disabled={isCrawling}
              />
              <Button
                onClick={handleCrawl}
                disabled={isCrawling || !crawlUrl.trim()}
                className="bg-primary hover:bg-primary/80 text-primary-foreground shadow-lg shadow-primary/20"
              >
                {isCrawling ? (
                  <FiGlobe className="w-4 h-4 animate-spin" />
                ) : (
                  <FiGlobe className="w-4 h-4" />
                )}
              </Button>
            </div>
            {crawlStatus && (
              <p className={cn('text-xs', crawlStatus.includes('Failed') ? 'text-destructive' : 'text-accent')}>
                {crawlStatus}
              </p>
            )}
            <div className="p-3 rounded-lg bg-background/50 border border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Paste URLs to CoC wikis, strategy guides, patch notes, or community resources.
                Luna will crawl and index the content for future reference.
              </p>
            </div>

            {sampleMode && (
              <div className="space-y-2 mt-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Example Sources</p>
                {[
                  'clashofclans.fandom.com - Strategy Guides',
                  'reddit.com/r/ClashOfClans - Meta Discussions',
                  'clashofclans.com - Official Patch Notes',
                ].map((source, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <FiCheck className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                    <span className="text-xs text-foreground/80">{source}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
