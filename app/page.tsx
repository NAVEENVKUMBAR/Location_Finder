'use client';

import { useEffect, useMemo, useState } from 'react';
import JSZip from 'jszip';
import { SearchForm } from '@/components/search-form';
import { BusinessTable } from '@/components/business-table';
import { Business, DataSource, HospitalityCategory, WebsiteStatus } from '@/lib/types';
import { generateMockProspectRecords } from '@/lib/mock-data';
import { searchBusinesses, resolveLocation, LocationResolution } from '@/lib/search';
import { Button } from '@/components/ui/button';
import { MapPin, Search, Download, BarChart3, Users, Globe2, AlertCircle, ArrowRight, X, CheckCircle2, Clock3, Menu, LayoutDashboard, ClipboardList, Settings2, Bell, ChevronRight, BookOpen, FileText, SlidersHorizontal, ExternalLink, MessageCircle } from 'lucide-react';

export default function Page() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [location, setLocation] = useState('Bengaluru');
  const [category, setCategory] = useState<HospitalityCategory>('Restaurants');
  const [source, setSource] = useState<DataSource>('Google Maps');
  const [statusFilter, setStatusFilter] = useState<'ALL' | WebsiteStatus>('ALL');
  const [phoneFilter, setPhoneFilter] = useState<'ALL' | 'WITH_PHONE' | 'WITHOUT_PHONE'>('ALL');
  const [resolvedLocation, setResolvedLocation] = useState<LocationResolution | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [pipelineBusinesses, setPipelineBusinesses] = useState<Business[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState('finder');
  const [activePanel, setActivePanel] = useState<'reports' | 'settings' | 'guide' | null>(null);
  const [generatorBusiness, setGeneratorBusiness] = useState<Business | null>(null);

  const prospects = useMemo(() => generateMockProspectRecords(businesses, location), [businesses, location]);
  const pipelineIds = useMemo(() => pipelineBusinesses.map((business) => business.id), [pipelineBusinesses]);
  const visibleBusinesses = useMemo(() => businesses
    .filter((business) => statusFilter === 'ALL' || business.websiteStatus === statusFilter)
    .filter((business) => phoneFilter === 'ALL' || (phoneFilter === 'WITH_PHONE' ? Boolean(business.phone?.trim()) : !business.phone?.trim()))
    .slice(), [businesses, statusFilter, phoneFilter]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 3500);
  };

  useEffect(() => {
    if (activeSection !== 'pipeline') return;

    fetch('/api/pipeline', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Could not load pipeline')))
      .then((payload: { records?: Array<{ business: Business }> }) => setPipelineBusinesses((payload.records ?? []).map((record) => record.business)))
      .catch(() => showNotice('Could not load your delivery pipeline.'));
  }, [activeSection]);

  const toggleSelection = (business: Business) => {
    setSelectedIds((current) => current.includes(business.id) ? current.filter((id) => id !== business.id) : [...current, business.id]);
  };

  const addToPipeline = async (businessesToAdd: Business[]) => {
    if (pipelineBusy || !businessesToAdd.length) return;
    setPipelineBusy(true);
    try {
      const response = await fetch('/api/pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businesses: businessesToAdd }) });
      const payload = await response.json() as { added?: Array<{ business: Business }>; duplicates?: Business[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Could not save pipeline records.');
      const added = (payload.added ?? []).map((record) => record.business);
      setPipelineBusinesses((current) => [...current, ...added]);
      setSelectedIds((current) => current.filter((id) => !added.some((business) => business.id === id)));
      showNotice(`${added.length} added${payload.duplicates?.length ? `; ${payload.duplicates.length} already in pipeline` : ''}.`);
    } catch (error) {
      showNotice(error instanceof Error ? error.message : 'Could not save pipeline records.');
    } finally {
      setPipelineBusy(false);
    }
  };

  const removeFromPipeline = async (id: string) => {
    const response = await fetch(`/api/pipeline?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) return showNotice('Could not remove that pipeline record.');
    setPipelineBusinesses((current) => current.filter((business) => business.id !== id));
    showNotice('Business removed from your pipeline.');
  };
  const noWebsiteCount = businesses.filter((b) => b.websiteStatus === 'NO_WEBSITE').length;
  const inactiveCount = businesses.filter((b) => b.websiteStatus === 'INACTIVE').length;
  const highPriorityCount = prospects.filter((p) => p.priority === 'HIGH').length;

  const handleSearch = async (nextLocation: string, nextCategory: HospitalityCategory, nextSource: DataSource) => {
    setIsSearching(true);
    setSearchError(null);
    setLocation(nextLocation);
    setCategory(nextCategory);
    setSource(nextSource);
    setStatusFilter('ALL');
    setPhoneFilter('ALL');
    try {
      const resolution = await resolveLocation(nextLocation);
      setResolvedLocation(resolution);
      const results = await searchBusinesses(nextLocation, nextCategory, nextSource);
      setBusinesses(results);
      setSearched(true);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Could not load live businesses');
    } finally {
      setIsSearching(false);
    }
  };

  const exportResults = (records: Business[] = visibleBusinesses, scope: 'filtered' | 'all' = 'filtered') => {
    if (!records.length) {
      showNotice(scope === 'filtered' ? 'No businesses match the current filters.' : 'There are no businesses to export.');
      return;
    }
    const headers = ['Business Name', 'Category', 'Address', 'Phone', 'Website', 'Website Status', 'Rating', 'Opening Hours', 'Map Link', 'Source', 'Data Completeness', 'Last Verified'];
    const rows = records.map((b) => [b.name, b.category, b.address || 'Not available', b.phone || 'Not available', b.website || 'Not available', b.websiteStatus, b.rating?.toString() || 'Not available', b.openingHours ? 'Available' : 'Not available', b.mapUrl || 'Not available', b.source, `${b.dataCompleteness}%`, b.lastVerifiedAt || 'Not available']);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${location.toLowerCase().replaceAll(' ', '-')}-hospitality-${scope}-results.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showNotice(`${records.length} ${scope} result${records.length === 1 ? '' : 's'} exported.`);
  };

  return (
    <main className="h-screen min-h-0 overflow-hidden bg-background text-foreground">
      {notice && <div role="status" className="fixed right-5 top-5 z-[60] flex max-w-sm items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-lg"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#5d8864]" /><span>{notice}</span><button aria-label="Dismiss notification" onClick={() => setNotice(null)} className="ml-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button></div>}
      <div className="flex h-screen min-h-0">
        <aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex h-20 items-center gap-3 border-b border-border px-6">
<div className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-transparent p-0"><img src="/sthala-logo.png" alt="Sthala logo" className="h-full w-full rounded-lg object-contain" /></div>
  <div><p className="font-serif text-lg font-semibold leading-tight tracking-tight"><span className="block text-primary">Sthala</span><span className="mt-0.5 block text-xs font-medium italic text-muted-foreground">Every Spot, One Search</span></p></div>
          </div>
          <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
            <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
            <a className="flex items-center gap-3 rounded-md bg-sidebar-accent px-3 py-2.5 text-sm font-medium text-sidebar-accent-foreground" href="#finder"><LayoutDashboard className="h-4 w-4" /> Finder</a>
            <button onClick={() => { setActiveSection('pipeline'); showNotice(`${pipelineBusinesses.length} business${pipelineBusinesses.length === 1 ? '' : 'es'} in your delivery pipeline.`); }} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm ${activeSection === 'pipeline' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><ClipboardList className="h-4 w-4" /> Delivery pipeline <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">{pipelineBusinesses.length}</span></button>
            <p className="px-3 pb-2 pt-8 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Manage</p>
            <button onClick={() => setActivePanel('reports')} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm ${activePanel === 'reports' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><BarChart3 className="h-4 w-4" /> Reports</button>
            <button onClick={() => setActivePanel('settings')} className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm ${activePanel === 'settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}><Settings2 className="h-4 w-4" /> Settings</button>
          </nav>
          <div className="m-4 rounded-lg border border-border bg-background p-4"><p className="text-xs font-semibold">Need a hand?</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Check the verification guide before contacting a new business.</p><button onClick={() => setActivePanel('guide')} className="mt-3 text-xs font-semibold text-primary hover:underline">View guide <ArrowRight className="ml-1 inline h-3 w-3" /></button></div>
        </aside>
        {sidebarOpen && <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-black/20 lg:hidden" />}

        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <header className="flex h-20 items-center justify-between border-b border-border bg-background px-5 sm:px-8">
            <div className="flex items-center gap-3"><button className="lg:hidden" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button><h1 className="flex items-baseline gap-1 tracking-tight"><span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Welcome to</span><span className="font-serif text-2xl font-semibold text-primary">Sthala</span><span className="hidden text-sm font-medium italic text-muted-foreground sm:inline">Every Spot, One Search</span></h1></div>
          </header>

          {activeSection === 'pipeline' ? <PipelineView businesses={pipelineBusinesses} onRemove={removeFromPipeline} onSelect={setSelectedBusiness} /> : <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8" id="finder">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">Find your next <em className="text-primary">opportunity.</em></h2><p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">Discover hospitality businesses, qualify their website potential, and move the right prospects into your delivery pipeline.</p></div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-[#6d9c72]" /> Data provider connected <span className="text-border">|</span> Last synced 4m ago</div></div>

            <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="mb-5 flex items-start justify-between"><div><p className="text-sm font-semibold">Start a search</p><p className="mt-1 text-xs text-muted-foreground">Location + category</p></div><div className="rounded-md bg-primary/10 p-2 text-primary"><Search className="h-4 w-4" /></div></div><SearchForm onSearch={handleSearch} loading={isSearching} /><div className="mt-5 flex gap-2 rounded-md bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> Search anywhere — city, town, area or locality.</div></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="Businesses found" value={searched ? businesses.length.toString() : '—'} detail={searched ? `${category} in ${location}` : 'Run a search to begin'} icon={<Globe2 />} />
                <StatCard label="No website" value={searched ? noWebsiteCount.toString() : '—'} detail="Highest opportunity" icon={<AlertCircle />} accent="orange" />
                <StatCard label="Inactive website" value={searched ? inactiveCount.toString() : '—'} detail="Needs a refresh" icon={<Clock3 />} accent="yellow" />
                <StatCard label="High priority" value={searched ? highPriorityCount.toString() : '—'} detail="Ready for outreach" icon={<CheckCircle2 />} accent="green" />
              </div>
            </div>

            {resolvedLocation && !resolvedLocation.resolved && resolvedLocation.candidates && <div className="rounded-lg border border-[#dec995] bg-[#fffaf0] p-4 text-sm"><p className="font-semibold">Select a location</p><p className="mt-1 text-muted-foreground">We found more than one match for “{resolvedLocation.query}”.</p></div>}
            {searchError && <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"><p className="font-semibold">Live search unavailable</p><p className="mt-1">{searchError}</p></div>}

            <div className="rounded-xl border border-border bg-card shadow-sm"><div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><h3 className="font-serif text-2xl font-medium">Search results</h3>{searched && <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{resolvedLocation?.display || location}</span>}</div><p className="mt-1 text-xs text-muted-foreground">{searched ? `${businesses.length} businesses found · prioritised by website opportunity` : 'Your qualified businesses will appear here'}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => exportResults(visibleBusinesses, 'filtered')} disabled={!searched || !visibleBusinesses.length} title="Download only the results matching the current filters"><Download className="mr-2 h-3.5 w-3.5" /> Export filtered</Button><Button variant="outline" size="sm" onClick={() => exportResults(businesses, 'all')} disabled={!searched || !businesses.length} title="Download every result from this search"><Download className="mr-2 h-3.5 w-3.5" /> Export all</Button><Button size="sm" disabled={!searched || !businesses.length} onClick={() => addToPipeline(businesses.filter((business) => selectedIds.includes(business.id)))}><Users className="mr-2 h-3.5 w-3.5" /> Add to pipeline</Button></div></div><div className="border-b border-border bg-muted/20 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex flex-wrap items-center gap-2"><label className="text-xs font-medium text-muted-foreground" htmlFor="status-filter">Filter</label><select id="status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | WebsiteStatus)} className="rounded-md border border-input bg-card px-3 py-2 text-xs"><option value="ALL">All websites</option><option value="ACTIVE">Active website</option><option value="INACTIVE">Inactive website</option><option value="NO_WEBSITE">No website</option></select><label className="sr-only" htmlFor="phone-filter">Phone availability</label><select id="phone-filter" value={phoneFilter} onChange={(event) => setPhoneFilter(event.target.value as 'ALL' | 'WITH_PHONE' | 'WITHOUT_PHONE')} className="rounded-md border border-input bg-card px-3 py-2 text-xs"><option value="ALL">All phone records</option><option value="WITH_PHONE">Has phone number</option><option value="WITHOUT_PHONE">No phone number</option></select></div><p className="text-xs text-muted-foreground">Showing {visibleBusinesses.length} of {businesses.length} · {source}</p></div></div><div className="p-5">{searched ? <BusinessTable businesses={visibleBusinesses} onSelectBusiness={setSelectedBusiness} selectedIds={selectedIds} pipelineIds={pipelineIds} onToggleSelection={toggleSelection} onToggleAll={(items) => setSelectedIds((current) => items.every((item) => current.includes(item.id)) ? current.filter((id) => !items.some((item) => item.id === id)) : [...new Set([...current, ...items.map((item) => item.id)])])} onAddToPipeline={(business) => addToPipeline([business])} /> : <EmptyState />}</div></div>
          </div>}
        </section>
      </div>

      {activePanel && <WorkspacePanel panel={activePanel} businesses={businesses} pipelineCount={pipelineBusinesses.length} onClose={() => setActivePanel(null)} onExport={exportResults} />}
      {selectedBusiness && <ProspectDrawer business={selectedBusiness} onClose={() => setSelectedBusiness(null)} onGenerate={() => { setGeneratorBusiness(selectedBusiness); setSelectedBusiness(null); }} />}
      {generatorBusiness && <ProfessionalWebsite business={generatorBusiness} onClose={() => setGeneratorBusiness(null)} />}
    </main>
  );
}

function PipelineView({ businesses, onRemove, onSelect }: { businesses: Business[]; onRemove: (id: string) => void; onSelect: (business: Business) => void }) { return <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Workspace</p><h2 className="mt-2 font-serif text-4xl font-medium">Delivery pipeline</h2><p className="mt-2 text-sm text-muted-foreground">Saved prospects stay here independently of your latest search.</p></div><div className="rounded-xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-sm font-semibold">Saved businesses</p><p className="mt-1 text-xs text-muted-foreground">{businesses.length} saved prospect{businesses.length === 1 ? '' : 's'}</p></div></div>{businesses.length ? <div className="divide-y divide-border">{businesses.map((business) => <div key={business.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{business.name}</p><p className="mt-1 text-xs text-muted-foreground">{business.category} · {business.address || 'Location not available'}</p><p className="mt-1 text-xs text-muted-foreground">{business.phone || 'No phone'} {business.website ? '· Website available' : '· No website'}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => onSelect(business)}>View</Button><Button size="sm" variant="outline" onClick={() => onRemove(business.id)}>Remove</Button></div></div>)}</div> : <div className="p-12 text-center"><p className="font-serif text-xl">Your pipeline is empty</p><p className="mt-2 text-sm text-muted-foreground">Search for hospitality businesses and add selected prospects to build your delivery pipeline.</p></div>}</div></div> }

function StatCard({ label, value, detail, icon, accent = 'default' }: { label: string; value: string; detail: string; icon: React.ReactNode; accent?: string }) {
  const color = accent === 'orange' ? 'text-[#b86a43] bg-[#fff2e9]' : accent === 'yellow' ? 'text-[#a9893f] bg-[#fff9e6]' : accent === 'green' ? 'text-[#5d8864] bg-[#edf6ee]' : 'text-primary bg-primary/10';
  return <div className="rounded-xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">{label}</p><span className={`rounded-md p-2 ${color}`}>{icon}</span></div><p className="mt-5 font-serif text-3xl font-medium">{value}</p><p className="mt-1 truncate text-xs text-muted-foreground">{detail}</p></div>;
}

function EmptyState() { return <div className="flex min-h-[340px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-center"><div className="mb-4 rounded-full bg-primary/10 p-4 text-primary"><Search className="h-6 w-6" /></div><h4 className="font-serif text-xl">Start with a location</h4><p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Search for restaurants, stays, PGs and more anywhere in the country to see qualified opportunities.</p><p className="mt-4 text-xs font-medium text-primary">Try “Bengaluru” or “Koramangala”</p></div> }

function WorkspacePanel({ panel, businesses, pipelineCount, onClose, onExport }: { panel: 'reports' | 'settings' | 'guide'; businesses: Business[]; pipelineCount: number; onClose: () => void; onExport: () => void }) {
  const noWebsite = businesses.filter((business) => business.websiteStatus === 'NO_WEBSITE').length;
  const inactiveWebsite = businesses.filter((business) => business.websiteStatus === 'INACTIVE').length;
  const title = panel === 'reports' ? 'Reports' : panel === 'settings' ? 'Workspace settings' : 'Verification guide';
  const Icon = panel === 'reports' ? FileText : panel === 'settings' ? SlidersHorizontal : BookOpen;

  return <>
    <button aria-label="Close workspace panel" className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
    <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border bg-card shadow-2xl" aria-label={title}>
      <div className="flex items-center justify-between border-b border-border p-5"><div className="flex items-center gap-3"><span className="rounded-md bg-primary/10 p-2 text-primary"><Icon className="h-4 w-4" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Sthala</p><h2 className="mt-1 font-serif text-2xl font-medium">{title}</h2></div></div><button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div>
      <div className="flex flex-col gap-6 p-5">
        {panel === 'reports' && <><section className="grid grid-cols-2 gap-3"><MiniMetric label="Businesses found" value={businesses.length} /><MiniMetric label="Pipeline" value={pipelineCount} /><MiniMetric label="No website" value={noWebsite} /><MiniMetric label="Inactive sites" value={inactiveWebsite} /></section><section className="rounded-lg border border-border p-4"><h3 className="font-semibold">Opportunity summary</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Use these live search metrics to prioritize businesses that need a new or improved website.</p><div className="mt-4 flex flex-col gap-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Website opportunity</span><strong>{noWebsite + inactiveWebsite}</strong></div><div className="flex justify-between"><span className="text-muted-foreground">Ready for delivery pipeline</span><strong>{pipelineCount}</strong></div></div></section><Button className="w-full" onClick={onExport} disabled={!businesses.length}><Download data-icon="inline-start" /> Export current report</Button></>}
        {panel === 'settings' && <><section className="flex flex-col gap-4"><SettingRow title="Search radius" detail="Results are limited to 10 km around the resolved location." /><SettingRow title="Live data provider" detail="Google Places API (primary)" /><SettingRow title="Website verification" detail="Checks the business website when a listing provides one." /><SettingRow title="Result source" detail="Live results only; no sample businesses are mixed into searches." /></section><div className="rounded-lg bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">Settings are applied automatically to new searches. API credentials stay server-side and are never exposed in the browser.</div></>}
        {panel === 'guide' && <section className="flex flex-col gap-4"><GuideStep number="1" title="Confirm the location" detail="Check the resolved locality and map coordinates shown on each result before outreach." /><GuideStep number="2" title="Review contact details" detail="Open a business to verify its phone, address, website, rating, and map listing." /><GuideStep number="3" title="Qualify the opportunity" detail="Prioritize no-website and inactive-website businesses, then add qualified prospects to the pipeline." /><GuideStep number="4" title="Export or deliver" detail="Export the current result set for your team, or track selected prospects in the delivery pipeline." /><a href="https://www.tomtom.com/products/search-api/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">View data provider docs <ExternalLink className="h-4 w-4" /></a></section>}
      </div>
    </aside>
  </>;
}

function MiniMetric({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border border-border bg-muted/40 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-serif text-2xl font-medium">{value}</p></div>; }
function SettingRow({ title, detail }: { title: string; detail: string }) { return <div className="rounded-lg border border-border p-4"><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{detail}</p></div>; }
function GuideStep({ number, title, detail }: { number: string; title: string; detail: string }) { return <div className="flex gap-3"><span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{number}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{detail}</p></div></div>; }

function ProspectDrawer({ business, onClose, onGenerate }: { business: Business; onClose: () => void; onGenerate: () => void }) { return <><button aria-label="Close prospect details" className="fixed inset-0 z-40 bg-black/20" onClick={onClose} /><aside className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-border bg-card shadow-2xl"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Prospect workspace</p><h3 className="mt-1 font-serif text-2xl">{business.name}</h3></div><button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="space-y-6 p-5"><div className="rounded-lg border border-primary/20 bg-primary/5 p-4"><p className="text-sm font-semibold">No website found?</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Create a category-aware draft using only this verified business record.</p><Button className="mt-3 w-full" size="sm" onClick={onGenerate} disabled={business.websiteStatus !== 'NO_WEBSITE' || !business.phone?.trim()}>Generate Website</Button>{business.websiteStatus !== 'NO_WEBSITE' && <p className="mt-2 text-xs text-muted-foreground">Generation is available only for businesses without an existing website.</p>}{business.websiteStatus === 'NO_WEBSITE' && !business.phone?.trim() && <p className="mt-2 text-xs text-destructive">This result cannot generate a website until Google provides a verified mobile number for calls and WhatsApp.</p>}</div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${business.websiteStatus === 'NO_WEBSITE' ? 'bg-orange-50 text-orange-900' : business.websiteStatus === 'INACTIVE' ? 'bg-yellow-50 text-yellow-900' : 'bg-green-50 text-green-900'}`}>{business.websiteStatus === 'NO_WEBSITE' ? 'No website' : business.websiteStatus === 'INACTIVE' ? 'Inactive website' : 'Active website'}</span><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{business.category}</span></div><section><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Business details</p><dl className="mt-3 divide-y divide-border rounded-lg border border-border"><DetailRow label="Address" value={business.address || 'Not available'} /><DetailRow label="Phone" value={business.phone || 'Not available'} /><DetailRow label="Rating" value={business.rating ? `${business.rating} / 5` : 'Not available'} /><DetailRow label="Data completeness" value={`${business.dataCompleteness}%`} /></dl></section><section><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Verification</p><div className="mt-3 rounded-lg bg-muted/60 p-4"><div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-4 w-4 text-[#5d8864]" /><div><p className="text-sm font-medium">{business.websiteCheckStatus}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Checked against the available business listing. Confirm details with the owner before publishing.</p></div></div></div></section><section><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Next action</p><div className="mt-3 grid gap-2"><Button className="justify-between">Assign to pipeline <ArrowRight className="h-4 w-4" /></Button><Button variant="outline" className="justify-between">Record owner contact <ArrowRight className="h-4 w-4" /></Button></div></section><p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">No unverified information is included in this workspace. Preview websites must remain marked as drafts until the owner approves them.</p></div></aside></> }

function DetailRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="max-w-[60%] text-right font-medium">{value}</dd></div>; }

function ProfessionalWebsite({ business, onClose }: { business: Business; onClose: () => void }) {
  const isFood = ['Restaurants', 'Cafés', 'Bakeries'].some((category) => business.category.toLowerCase().includes(category.toLowerCase()));
  const isStay = ['Hotels', 'Resorts', 'Lodges', 'Homestays', 'Guest Houses', 'PGs', 'Hostels'].some((category) => business.category.toLowerCase().includes(category.toLowerCase()));
  const mapUrl = business.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, business.address].filter(Boolean).join(', '))}`;
  const normalizedPhone = business.phone?.trim() || '';
  const phoneDigits = normalizedPhone.replace(/\D/g, '');
  const whatsappUrl = normalizedPhone.startsWith('+') && phoneDigits.length >= 8 ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(`Hello ${business.name}, I found you through Sthala.`)}` : null;
  const photoUrl = `/api/place-photo?${business.photoName ? `name=${encodeURIComponent(business.photoName)}` : `query=${encodeURIComponent([business.name, business.address, business.category].filter(Boolean).join(', '))}`}`;
  const [siteUrl, setSiteUrl] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [imageArchive, setImageArchive] = useState<File | null>(null);
  const [uploadedImages, setUploadedImages] = useState<Array<{ name: string; dataUrl: string }>>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const handleImageArchive = async (file: File | undefined) => {
    if (!file) return;
    setImageArchive(file);
    setUploadError(null);
    if (!file.name.toLowerCase().endsWith('.zip')) { setUploadError('Upload a ZIP file named after this business.'); return; }
    setIsUploadingImages(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((entry) => /\.(jpe?g|png|webp|gif)$/i.test(entry.name) && !entry.dir).slice(0, 24);
      const images = await Promise.all(entries.map(async (entry) => ({ name: entry.name.split('/').pop() || entry.name, dataUrl: `data:${entry.name.toLowerCase().endsWith('.png') ? 'image/png' : entry.name.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg'};base64,${await entry.async('base64')}` })));
      if (!images.length) throw new Error('No supported images found in the ZIP.');
      setUploadedImages(images);
    } catch (error) { setUploadedImages([]); setUploadError(error instanceof Error ? error.message : 'This ZIP could not be opened.'); }
    finally { setIsUploadingImages(false); }
  };
  const [isCreatingSite, setIsCreatingSite] = useState(false);
  const createStandaloneSite = async () => {
    setGenerationError(null);
    setIsCreatingSite(true);
    try {
      const aiResponse = await fetch('/api/website-design', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business }) });
      if (!aiResponse.ok) throw new Error('AI website generation is unavailable. Please try again.');
      const aiPayload = await aiResponse.json() as { design?: unknown };
      const response = await fetch('/api/websites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ business, uploadedImages, aiDesign: aiPayload.design }) });
const payload = await response.json() as { id?: string; url?: string };
  if (response.ok && payload.url && payload.id) {
    try { window.localStorage.setItem(`sthala:website:${payload.id}`, JSON.stringify({ business, uploadedImages, aiDesign: aiPayload.design })); } catch { /* Storage may be unavailable in private browsing. */ }
    setSiteUrl(`${payload.url}?view=1`);
  }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'AI website generation failed. Please try again.');
    } finally {
      setIsCreatingSite(false);
    }
  };

  const headline = isFood ? 'A table worth finding.' : isStay ? 'Stay somewhere memorable.' : 'Your next local favourite.';
  return <><button aria-label="Close website generator" className="fixed inset-0 z-50 bg-black/40" onClick={onClose} /><aside className="fixed inset-y-0 right-0 z-[60] w-full max-w-6xl overflow-y-auto bg-[#f8f6f1] text-[#2e2925] shadow-2xl"><div className="mx-auto mt-4 max-w-5xl px-5 sm:px-10"><div className="rounded-2xl border border-dashed border-[#a45e32]/40 bg-[#fffaf0] p-4"><p className="text-sm font-semibold">Add photos for {business.name}</p><p className="mt-1 text-xs text-[#665f58]">Upload the ZIP directly. Name the ZIP after the business; image filenames do not need to be changed.</p><label className="mt-3 inline-flex cursor-pointer rounded-lg border border-[#ded8ce] bg-white px-3 py-2 text-xs font-semibold"><input type="file" accept=".zip,application/zip" className="sr-only" onChange={(event) => void handleImageArchive(event.target.files?.[0])} />{isUploadingImages ? 'Reading ZIP…' : imageArchive ? `${imageArchive.name} · ${uploadedImages.length} image${uploadedImages.length === 1 ? '' : 's'}` : 'Choose image ZIP'}</label>{uploadError && <p role="alert" className="mt-2 text-xs text-red-700">{uploadError}</p>}{generationError && <p role="alert" className="mt-2 text-xs text-red-700">{generationError}</p>}<button type="button" onClick={() => void createStandaloneSite()} disabled={isCreatingSite || isUploadingImages || Boolean(uploadError)} className="ml-3 rounded-lg bg-[#2e2925] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">{isCreatingSite ? 'Generating…' : 'Generate website'}</button></div></div><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ded8ce] bg-[#f8f6f1]/95 px-5 py-4 backdrop-blur sm:px-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45e32]">Generated website · live business data</p><h2 className="mt-1 font-serif text-xl sm:text-2xl">{business.name}</h2></div><button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-[#665f58] hover:bg-[#e9e4dc]"><X className="h-5 w-5" /></button></div><div className="mx-auto max-w-5xl px-5 py-6 sm:px-10 sm:py-10"><div className="overflow-hidden rounded-[2rem] bg-[#2f2924] text-white shadow-xl"><div className="relative min-h-[390px] overflow-hidden sm:min-h-[500px]">{photoUrl ? <img src={photoUrl} alt={`${business.name} in ${business.address || 'the local area'}`} className="absolute inset-0 h-full w-full object-cover opacity-70" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#a96238] via-[#6e3d28] to-[#241d19]" />}<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-black/10" /><div className="relative flex min-h-[390px] flex-col justify-end p-7 sm:min-h-[500px] sm:p-12"><div className="mb-6 flex items-center gap-3 text-sm"><span className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 backdrop-blur">{business.category}</span>{business.rating && <span>★ {business.rating}</span>}</div><p className="max-w-2xl font-serif text-5xl leading-[0.95] sm:text-7xl">{headline}</p><p className="mt-5 max-w-xl text-sm leading-6 text-white/80">{business.address || 'Discover a welcoming local experience, thoughtfully placed in your neighbourhood.'}</p><div className="mt-7 flex flex-wrap gap-3"><a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#2f2924] transition hover:bg-[#f0e6d9]">Get directions</a>{business.phone && <a href={`tel:${business.phone.replace(/\\D/g, '')}`} className="rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Call {business.phone}</a>}</div></div></div><div className="grid gap-8 bg-[#fffdf9] p-7 text-[#2e2925] sm:grid-cols-[1.2fr_0.8fr] sm:p-12"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a45e32]">Welcome</p><h3 className="mt-3 font-serif text-3xl sm:text-4xl">Made for moments that matter.</h3><p className="mt-4 max-w-xl text-sm leading-7 text-[#6d655d]">A polished, location-first experience built around verified information from Google Places. Add your own story, menu, rooms, offers, and brand voice before publishing.</p></div><div className="rounded-2xl bg-[#f3eee7] p-5"><p className="text-sm font-semibold">At a glance</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#6d655d]"><span>{business.address || 'Address to be confirmed'}</span><span>{business.phone || 'Phone number unavailable'}</span><span>{business.openingHours ? 'Opening hours available' : 'Opening hours to be added'}</span></div></div></div><div className="flex flex-col gap-3 border-t border-[#ded8ce] bg-[#fffdf9] px-7 pb-8 sm:flex-row sm:items-center sm:justify-between sm:px-12"><p className="text-xs text-[#81786f]">Draft concept · verify content and ownership before publishing</p><a href={mapUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#a45e32] hover:underline">View on Google Maps <ExternalLink className="ml-1 inline h-3.5 w-3.5" /></a></div></div></div>{siteUrl && <a href={siteUrl} target="_blank" rel="noreferrer" className="fixed bottom-6 left-6 z-[70] rounded-full bg-[#2f2924] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#4a3b30]">Open full website</a>}</aside>{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label={`Chat with ${business.name} on WhatsApp`} className="fixed bottom-6 right-6 z-[70] inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1ebe5d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"><MessageCircle aria-hidden="true" className="h-4 w-4" /> WhatsApp</a>}</>;
}

function WebsiteGenerator({ business, onClose }: { business: Business; onClose: () => void }) {
  const isFood = ['Restaurants', 'Cafés', 'Bakeries'].some((category) => business.category.toLowerCase().includes(category.toLowerCase()));
  const isStay = ['Hotels', 'Resorts', 'Lodges', 'Homestays', 'Guest Houses', 'PGs', 'Hostels'].some((category) => business.category.toLowerCase().includes(category.toLowerCase()));
  const phoneDigits = business.phone?.replace(/\D/g, '') || '';
  const mapUrl = business.mapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([business.name, business.address].filter(Boolean).join(', '))}`;
  const sections = isFood ? ['Welcome and brand story', 'Verified opening hours', 'Location and contact'] : isStay ? ['Hospitality hero', 'Verified stay information', 'Location and contact'] : ['Business introduction', 'Verified business details', 'Location and contact'];
  const [imageArchive, setImageArchive] = useState<File | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const uploadedImages = Array.from({ length: imageCount });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const handleImageArchive = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setImageArchive(file);
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setUploadError('Upload a ZIP file named after this business.');
      setImageCount(0);
      return;
    }
    setIsUploadingImages(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const count = Object.keys(zip.files).filter((name) => /\.(jpe?g|png|webp|gif)$/i.test(name) && !zip.files[name].dir).length;
      if (!count) setUploadError('That ZIP does not contain JPG, PNG, WEBP, or GIF images.');
      setImageCount(count);
    } catch {
      setUploadError('This ZIP could not be opened. Please choose a valid image archive.');
      setImageCount(0);
    } finally {
      setIsUploadingImages(false);
    }
  };
  return <><button aria-label="Close website generator" className="fixed inset-0 z-50 bg-black/30" onClick={onClose} /><aside className="fixed inset-y-0 right-0 z-[60] w-full max-w-3xl overflow-y-auto border-l border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Draft website generator</p><h2 className="mt-1 font-serif text-2xl">{business.name}</h2></div><button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button></div><div className="mx-5 mt-5 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-4"><div className="flex items-start gap-3"><div className="rounded-md bg-primary/10 p-2 text-primary"><Download className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">Add business photos</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Upload one ZIP named after this business. Images are unpacked into the generated gallery; nothing needs to be renamed.</p><label className="mt-3 inline-flex cursor-pointer items-center rounded-md border border-border bg-card px-3 py-2 text-xs font-medium hover:bg-muted"><input type="file" accept=".zip,application/zip" className="sr-only" onChange={(event) => void handleImageArchive(event.target.files?.[0])} />{isUploadingImages ? 'Reading archive…' : imageArchive ? `${imageArchive.name} · ${uploadedImages.length} image${uploadedImages.length === 1 ? '' : 's'}` : 'Choose image ZIP'}</label>{uploadError && <p role="alert" className="mt-2 text-xs text-destructive">{uploadError}</p>}</div></div></div><div className="grid gap-5 p-5 lg:grid-cols-[0.9fr_1.1fr]"><section className="flex flex-col gap-4"><div className="rounded-lg border border-[#dec995] bg-[#fffaf0] p-4 text-sm"><p className="font-semibold">Business website starter</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">A conversion-ready website built from verified listing details. Review the content with the business owner, then connect the final domain and booking tools before launch.</p></div><div className="rounded-lg border border-border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Generation plan</p><div className="mt-3 flex flex-col gap-3">{sections.map((section) => <div key={section} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-primary" />{section}</div>)}</div></div><div className="rounded-lg border border-border bg-card p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Verified source data</p><dl className="mt-3 divide-y divide-border"><DetailRow label="Category" value={business.category} /><DetailRow label="Address" value={business.address || 'Awaiting confirmation'} /><DetailRow label="Phone" value={business.phone || 'Not available'} /><DetailRow label="Rating" value={business.rating ? `${business.rating} / 5` : 'Not available'} /></dl></div></section><section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"><div className="border-b border-border bg-[#2d211b] p-6 text-white"><p className="text-xs uppercase tracking-[0.18em] text-[#f0bd78]">{business.category}</p><h3 className="mt-3 font-serif text-3xl">{business.name}</h3><p className="mt-3 max-w-md text-sm leading-relaxed text-white/75">A focused digital home for verified information, direct contact, and finding this business.</p><div className="mt-5 flex flex-wrap gap-2">{phoneDigits && <a className="rounded-md bg-[#f0bd78] px-3 py-2 text-xs font-semibold text-[#2d211b]" href={`tel:${business.phone}`}>Call now</a>}{phoneDigits && <a className="rounded-md border border-white/30 px-3 py-2 text-xs font-semibold text-white" href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer">WhatsApp</a>}<a className="rounded-md border border-white/30 px-3 py-2 text-xs font-semibold text-white" href={mapUrl} target="_blank" rel="noreferrer">Get directions</a></div></div><div className="flex flex-col gap-4 p-6"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">About</p><p className="mt-2 text-sm leading-relaxed">Verified details for {business.name}. Additional content will remain omitted until confirmed by the business.</p></div>{business.openingHours && <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Opening hours available</p><p className="mt-2 text-sm text-muted-foreground">Hours are available from the source record and can be displayed after review.</p></div>}<div className="rounded-lg bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">Preview only. This draft is noindex and must be reviewed, corrected, and owner-approved before publication.</div></div></section></div></aside></>;
}

