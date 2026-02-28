'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { FiActivity, FiDownload, FiSearch, FiClock, FiZap, FiDatabase } from 'react-icons/fi'
import { HiOutlineChat } from 'react-icons/hi'
import { BsBarChart, BsLightningCharge } from 'react-icons/bs'
import { GiCrossedSwords } from 'react-icons/gi'

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

interface ActivityMonitorProps {
  sampleMode: boolean
}

const SAMPLE_ACTIVITY: ActivityEntry[] = [
  {
    id: 's1', timestamp: new Date(Date.now() - 3600000).toISOString(),
    userQuery: 'Best TH12 war attack strategy?', lunaResponse: 'At TH12, the meta is heavily influenced by Siege Barracks and Yeti compositions...',
    topics: ['TH12', 'War Strategy'], confidence: 'high', kbUsed: true, responseTime: 1250,
  },
  {
    id: 's2', timestamp: new Date(Date.now() - 7200000).toISOString(),
    userQuery: 'How to upgrade heroes efficiently?', lunaResponse: 'Hero upgrades are critical. Here are my top tips for efficient hero progression...',
    topics: ['Heroes', 'Upgrade Priority'], confidence: 'high', kbUsed: true, responseTime: 980,
  },
  {
    id: 's3', timestamp: new Date(Date.now() - 10800000).toISOString(),
    userQuery: 'Is lalo still viable at TH15?', lunaResponse: 'Absolutely! LaLo (Lava Hound + Balloon) remains a top-tier strategy at TH15...',
    topics: ['TH15', 'LaLo', 'Air Attacks'], confidence: 'high', kbUsed: true, responseTime: 1100,
  },
  {
    id: 's4', timestamp: new Date(Date.now() - 14400000).toISOString(),
    userQuery: 'Clan capital raid strategy?', lunaResponse: 'For Clan Capital raids, coordination is key. Focus on destroying key defenses...',
    topics: ['Clan Capital', 'Raids'], confidence: 'medium', kbUsed: false, responseTime: 1450,
  },
  {
    id: 's5', timestamp: new Date(Date.now() - 18000000).toISOString(),
    userQuery: 'Best base layout for CWL?', lunaResponse: 'CWL base design depends on your league. For Crystal and above, anti-3 star...',
    topics: ['CWL', 'Base Design'], confidence: 'high', kbUsed: true, responseTime: 1320,
  },
]

export default function ActivityMonitor({ sampleMode }: ActivityMonitorProps) {
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    if (sampleMode) {
      setActivityLog(SAMPLE_ACTIVITY)
      return
    }
    try {
      const raw = localStorage.getItem('luna_activity_log')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          setActivityLog(parsed)
        }
      }
    } catch {
      setActivityLog([])
    }
  }, [sampleMode, refreshKey])

  const filteredLog = useMemo(() => {
    if (!searchQuery.trim()) return activityLog
    const q = searchQuery.toLowerCase()
    return activityLog.filter(
      (entry) =>
        (entry.userQuery?.toLowerCase() || '').includes(q) ||
        (entry.lunaResponse?.toLowerCase() || '').includes(q) ||
        (Array.isArray(entry.topics) && entry.topics.some((t) => t.toLowerCase().includes(q)))
    )
  }, [activityLog, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const total = activityLog.length
    const avgResponseTime = total > 0
      ? Math.round(activityLog.reduce((sum, e) => sum + (e.responseTime || 0), 0) / total)
      : 0
    const withFollowUp = activityLog.filter((e) => Array.isArray(e.topics) && e.topics.length > 0).length
    const followUpRate = total > 0 ? Math.round((withFollowUp / total) * 100) : 0
    const kbUsedCount = activityLog.filter((e) => e.kbUsed === true).length
    const kbRate = total > 0 ? Math.round((kbUsedCount / total) * 100) : 0
    return { total, avgResponseTime, followUpRate, kbRate }
  }, [activityLog])

  const handleExport = useCallback(() => {
    if (activityLog.length === 0) return
    const headers = ['Timestamp', 'User Query', 'Luna Response', 'Topics', 'Confidence', 'KB Used', 'Response Time (ms)']
    const rows = activityLog.map((e) => [
      e.timestamp || '',
      `"${(e.userQuery || '').replace(/"/g, '""')}"`,
      `"${(e.lunaResponse || '').replace(/"/g, '""')}"`,
      `"${Array.isArray(e.topics) ? e.topics.join(', ') : ''}"`,
      e.confidence || '',
      e.kbUsed ? 'Yes' : 'No',
      String(e.responseTime || 0),
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `luna-activity-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [activityLog])

  const confidenceColor = (level: string) => {
    if (level === 'high') return 'bg-accent/20 text-accent border-accent/30'
    if (level === 'low') return 'bg-destructive/20 text-destructive border-destructive/30'
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
  }

  const statCards = [
    { label: 'Total Responses', value: String(stats.total), icon: HiOutlineChat, colorClass: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'Avg Response Time', value: `${stats.avgResponseTime}ms`, icon: FiClock, colorClass: 'text-accent', bgColor: 'bg-accent/10' },
    { label: 'Topic Coverage', value: `${stats.followUpRate}%`, icon: BsBarChart, colorClass: 'text-sky-400', bgColor: 'bg-sky-400/10' },
    { label: 'KB Retrieval Rate', value: `${stats.kbRate}%`, icon: FiDatabase, colorClass: 'text-pink-400', bgColor: 'bg-pink-400/10' },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <FiActivity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Activity Monitor</h2>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="bg-card border-border shadow-xl shadow-black/20 hover:shadow-primary/5 transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bgColor)}>
                  <stat.icon className={cn('w-5 h-5', stat.colorClass)} />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity log..."
            className="pl-9 bg-input border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="border-border hover:bg-primary/10 hover:text-primary"
        >
          <FiActivity className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={activityLog.length === 0}
          className="border-border hover:bg-primary/10 hover:text-primary"
        >
          <FiDownload className="w-3.5 h-3.5 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {/* Activity Table */}
      <Card className="bg-card border-border shadow-xl shadow-black/20">
        <ScrollArea className="h-[calc(100vh-420px)]">
          {filteredLog.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8">
              <div className="w-14 h-14 rounded-full bg-muted/10 flex items-center justify-center mb-4">
                <GiCrossedSwords className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">No activity recorded yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Start chatting with Luna to see interaction activity here. All conversations are logged locally.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider w-[140px]">Timestamp</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">User Query</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Luna Response</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider w-[140px]">Topics</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider w-[90px]">Confidence</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider w-[60px]">KB</TableHead>
                  <TableHead className="text-muted-foreground text-xs font-medium uppercase tracking-wider w-[80px]">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLog.map((entry, idx) => (
                  <TableRow key={entry.id || idx} className={cn('border-border', idx % 2 === 0 ? 'bg-card' : 'bg-background/30')}>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-foreground max-w-[200px] truncate">{entry.userQuery || '-'}</TableCell>
                    <TableCell className="text-sm text-foreground/80 max-w-[200px] truncate">{entry.lunaResponse || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(entry.topics) && entry.topics.slice(0, 2).map((topic, tidx) => (
                          <Badge key={tidx} variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20 border px-1.5 py-0">
                            {topic}
                          </Badge>
                        ))}
                        {Array.isArray(entry.topics) && entry.topics.length > 2 && (
                          <Badge variant="secondary" className="text-[10px] bg-muted/20 text-muted-foreground border-border border px-1.5 py-0">
                            +{entry.topics.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[10px] capitalize border', confidenceColor(entry.confidence || ''))}>
                        {entry.confidence || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={cn('w-2.5 h-2.5 rounded-full mx-auto', entry.kbUsed ? 'bg-accent shadow-sm shadow-accent/50' : 'bg-muted-foreground/30')} />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">{entry.responseTime ? `${entry.responseTime}ms` : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </Card>
    </div>
  )
}
