import { useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type PointerEvent as ReactPointerEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Crosshair,
  Grid3X3,
  Layers3,
  Menu,
  Moon,
  Minus,
  Move,
  PanelRight,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  UserRoundPlus,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import {
  getGetProjectQueryKey,
  getListProjectsQueryKey,
  useCreateDancer,
  useCreateKeyframe,
  useCreateProject,
  useDeleteDancer,
  useDeleteKeyframe,
  useDuplicateKeyframe,
  useGetProject,
  useListProjects,
  useReorderKeyframes,
  useUpdateDancer,
  useUpdateKeyframe,
  useUpdateProject,
} from '@workspace/api-client-react';
import type { Dancer, Keyframe, Position, Project } from '@workspace/api-client-react';

const colorSwatches = ['#ef806a', '#67b6bd', '#cf9c61', '#ae8dc9', '#8ebd89', '#e6b85c'];

function Button({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}

function IconButton({ label, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; 'data-testid'?: string }) {
  return (
    <button
      {...props}
      aria-label={label}
      data-testid={props['data-testid'] ?? `button-${label.toLowerCase().replace(/\s+/g, '-')}`}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', testId }: { label: string; value: string | number; onChange: (value: string) => void; placeholder?: string; type?: string; testId: string }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <input
        data-testid={testId}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/65 focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}

function LoadingWorkspace() {
  return (
    <div className="min-h-[100dvh] bg-background p-5">
      <div className="mx-auto grid max-w-[1500px] animate-pulse gap-5 lg:grid-cols-[230px_minmax(0,1fr)_290px]">
        <div className="h-[88dvh] rounded-xl bg-sidebar/75" />
        <div className="space-y-4"><div className="h-14 rounded-xl bg-muted" /><div className="h-[65dvh] rounded-xl bg-muted" /></div>
        <div className="h-[88dvh] rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function NewProject({ onCreated }: { onCreated: (project: Project) => void }) {
  const createProject = useCreateProject();
  const [name, setName] = useState('Untitled rehearsal');
  const [description, setDescription] = useState('A new stage plan');
  const [stageWidth, setStageWidth] = useState('1200');
  const [stageHeight, setStageHeight] = useState('700');

  const submit = () => {
    if (!name.trim()) return;
    createProject.mutate({
      data: { name: name.trim(), description: description.trim(), stageWidth: Number(stageWidth), stageHeight: Number(stageHeight), gridSize: 40 },
    }, { onSuccess: onCreated });
  };

  return (
    <main className="noise flex min-h-[100dvh] items-center justify-center bg-background px-5 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-7 shadow-xl sm:p-10">
        <div className="mb-9 flex items-start justify-between">
          <div>
            <div className="mb-5 flex items-center gap-3"><Mark /><span className="font-mono text-xs uppercase tracking-[.18em] text-muted-foreground">Stagecraft / first scene</span></div>
            <h1 className="max-w-md text-4xl font-semibold leading-[.95] tracking-[-.045em]">Give the rehearsal a place to land.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">Set the dimensions of your stage, then place the ensemble one cue at a time.</p>
          </div>
          <Sparkles className="mt-1 text-primary" size={21} />
        </div>
        <div className="grid gap-5">
          <Field label="Project name" value={name} onChange={setName} testId="input-new-project-name" placeholder="e.g. Glass House — Act I" />
          <Field label="Working note" value={description} onChange={setDescription} testId="input-new-project-description" placeholder="What are you staging?" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Stage width" type="number" value={stageWidth} onChange={setStageWidth} testId="input-new-project-width" />
            <Field label="Stage height" type="number" value={stageHeight} onChange={setStageHeight} testId="input-new-project-height" />
          </div>
        </div>
        <Button data-testid="button-create-project" onClick={submit} disabled={createProject.isPending} className="mt-8 h-12 w-full border-primary bg-primary text-primary-foreground hover:bg-primary/90">
          {createProject.isPending ? 'Setting the floor…' : 'Open rehearsal workspace'}
          <ArrowRight size={16} />
        </Button>
        {createProject.isError && <p data-testid="status-create-project-error" className="mt-3 text-xs text-destructive">Could not create the project. Check the stage dimensions and try again.</p>}
      </section>
    </main>
  );
}

function Mark() {
  return <div aria-label="Stagecraft mark" className="relative grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"><span className="absolute h-4 w-px rotate-45 bg-primary-foreground" /><span className="absolute h-4 w-px -rotate-45 bg-primary-foreground" /><span className="relative h-1.5 w-1.5 rounded-full bg-primary-foreground" /></div>;
}

function ProjectRail({ projects, selectedId, onSelect, onNew, collapsed, onToggle }: { projects: Project[]; selectedId: string; onSelect: (id: string) => void; onNew: () => void; collapsed: boolean; onToggle: () => void }) {
  return (
    <aside className={`flex h-16 min-h-0 w-full flex-row items-center bg-sidebar px-3 py-3 text-sidebar-foreground transition-[width,padding] duration-200 lg:h-auto lg:flex-col lg:rounded-xl ${collapsed ? 'lg:w-[68px] lg:items-center lg:px-2' : 'lg:px-4'}`}>
      <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : 'px-2'}`}>
        <Mark />
        {!collapsed && <div><div className="text-sm font-semibold tracking-tight">Stagecraft</div><div className="font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/50">Rehearsal desk</div></div>}
      </div>
      <div className={`ml-auto flex items-center gap-1 lg:ml-0 lg:mt-9 ${collapsed ? 'lg:flex-col' : 'justify-between lg:px-2'}`}>
        {!collapsed && <span className="font-mono text-[10px] uppercase tracking-[.16em] text-sidebar-foreground/45">Projects</span>}
        <div className="flex items-center gap-1">
          <IconButton label={collapsed ? 'expand projects' : 'collapse projects'} data-testid="button-toggle-project-rail" onClick={onToggle} className="h-7 w-7 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"><Menu size={15} /></IconButton>
          <IconButton label="new project" data-testid="button-new-project" onClick={onNew} className="h-7 w-7 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"><Plus size={15} /></IconButton>
        </div>
      </div>
      <nav className={`mt-3 hidden gap-1 lg:grid ${collapsed ? 'w-full' : ''}`}>
        {projects.map((project) => (
          <button title={`${project.name} — ${project.stageWidth} × ${project.stageHeight}`} key={project.id} data-testid={`button-project-${project.id}`} onClick={() => onSelect(project.id)} className={`group grid items-center rounded-lg text-left transition-colors ${collapsed ? 'mx-auto h-10 w-10 place-items-center' : 'grid-cols-[7px_1fr] gap-3 px-2.5 py-3'} ${selectedId === project.id ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground'}`}>
            <span className={`rounded-full ${collapsed ? 'h-3 w-3' : 'h-7'} ${selectedId === project.id ? 'bg-sidebar-primary' : 'bg-sidebar-foreground/20'}`} />
            {!collapsed && <span className="min-w-0"><span className="block truncate text-sm font-medium">{project.name}</span><span className="mt-0.5 block font-mono text-[10px] text-sidebar-foreground/40">{project.stageWidth} × {project.stageHeight}</span></span>}
          </button>
        ))}
      </nav>
      {!collapsed && <div className="mt-auto border-t border-sidebar-border pt-4">
        <div className="flex items-center gap-2 px-2 text-sidebar-foreground/45"><CircleHelp size={15} /><span className="text-xs">Drag tokens to compose</span></div>
      </div>}
      {collapsed && <div className="mt-auto text-sidebar-foreground/45"><CircleHelp size={15} /></div>}
    </aside>
  );
}

function Topbar({ project, onProjectSettings, saveState, theme, onToggleTheme }: { project: Project; onProjectSettings: () => void; saveState: string; theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  return (
    <header className="flex min-h-[58px] items-center justify-between gap-3 border-b border-border px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="hidden items-center gap-2.5 sm:flex"><Mark /><div className="leading-none"><div className="text-xs font-semibold tracking-tight">Stagecraft</div><div className="mt-1 font-mono text-[8px] uppercase tracking-[.18em] text-muted-foreground">Rehearsal desk</div></div></div>
        <ChevronRight size={13} className="text-muted-foreground/60" />
        <span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Workspace</span><ChevronRight size={13} className="text-muted-foreground/60" /><h1 data-testid="text-project-name" className="truncate text-sm font-semibold">{project.name}</h1>
      </div>
      <div className="flex items-center gap-2">
        <span data-testid="status-save" className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground sm:flex"><span className={`h-1.5 w-1.5 rounded-full ${saveState === 'Saved' ? 'bg-[#72a979]' : 'bg-primary'}`} />{saveState}</span>
        <div className="hidden items-center gap-2 sm:flex"><div className="grid h-7 w-7 place-items-center rounded-md bg-secondary text-[10px] font-semibold text-secondary-foreground">MP</div><span className="hidden text-xs font-medium xl:block">Mara Pineda</span></div>
        <IconButton label={theme === 'light' ? 'switch to dark mode' : 'switch to light mode'} data-testid="button-toggle-theme" onClick={onToggleTheme} className="border border-border">{theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}</IconButton>
        <IconButton label="project settings" data-testid="button-project-settings" onClick={onProjectSettings}><Settings2 size={17} /></IconButton>
      </div>
    </header>
  );
}

function StageBoard({ project, dancers, keyframes, selectedKeyframe, onSelectDancer, onMoveDancer, onCommitPosition, gridSnap, setGridSnap, zoom, setZoom, pan, setPan, selectedDancerId }: {
  project: Project; dancers: Dancer[]; keyframes: Keyframe[]; selectedKeyframe: Keyframe | undefined; onSelectDancer: (id: string) => void; onMoveDancer: (id: string, position: Position) => void; onCommitPosition: (id: string) => void; gridSnap: boolean; setGridSnap: (value: boolean) => void; zoom: number; setZoom: (value: number) => void; pan: { x: number; y: number }; setPan: (value: { x: number; y: number }) => void; selectedDancerId?: string;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const panRef = useRef<{ pointerId: number; x: number; y: number; startX: number; startY: number } | null>(null);
  const [showPaths, setShowPaths] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const positions = selectedKeyframe?.positions ?? [];
  const previous = keyframes.find((frame) => frame.sortOrder === (selectedKeyframe?.sortOrder ?? 0) - 1);
  const getPosition = (id: string) => positions.find((position) => position.dancerId === id) ?? { dancerId: id, x: project.stageWidth / 2, y: project.stageHeight / 2 };

  const positionFromEvent = (event: ReactPointerEvent, id: string) => {
    const node = surfaceRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const rawX = Math.max(0, Math.min(project.stageWidth, ((event.clientX - rect.left) / rect.width) * project.stageWidth));
    const rawY = Math.max(0, Math.min(project.stageHeight, ((event.clientY - rect.top) / rect.height) * project.stageHeight));
    const snap = gridSnap ? project.gridSize : 1;
    onMoveDancer(id, { dancerId: id, x: Math.round(rawX / snap) * snap, y: Math.round(rawY / snap) * snap });
  };

  const onSurfacePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('[data-token]')) return;
    panRef.current = { pointerId: event.pointerId, x: pan.x, y: pan.y, startX: event.clientX, startY: event.clientY };
    setIsPanning(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onSurfacePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current) positionFromEvent(event, dragRef.current.id);
    if (panRef.current) setPan({ x: panRef.current.x + event.clientX - panRef.current.startX, y: panRef.current.y + event.clientY - panRef.current.startY });
  };
  const onSurfacePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      onCommitPosition(dragRef.current.id);
      dragRef.current = null;
    }
    if (panRef.current?.pointerId === event.pointerId) panRef.current = null;
    setIsPanning(false);
  };

  return (
    <section className="stage-surroundings flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-3 sm:px-6">
        <div><div className="flex items-center gap-2 text-xs font-semibold"><Crosshair size={14} className="text-primary" /> Stage view</div><div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{project.stageWidth} × {project.stageHeight} / {project.gridSize}px grid</div></div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card/70 p-1">
          <IconButton label="zoom out" data-testid="button-zoom-out" onClick={() => setZoom(Math.max(.65, Number((zoom - .1).toFixed(2))))}><ZoomOut size={15} /></IconButton>
          <span data-testid="text-zoom" className="w-12 text-center font-mono text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <IconButton label="zoom in" data-testid="button-zoom-in" onClick={() => setZoom(Math.min(1.5, Number((zoom + .1).toFixed(2))))}><ZoomIn size={15} /></IconButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <IconButton label="reset view" data-testid="button-reset-view" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}><RotateCcw size={15} /></IconButton>
          <span className="mx-1 h-5 w-px bg-border" />
          <IconButton label="toggle paths" data-testid="button-toggle-paths" onClick={() => setShowPaths(!showPaths)} className={showPaths ? 'bg-secondary/70 text-foreground' : ''}><Move size={15} /></IconButton>
        </div>
      </div>
      <div className="relative min-h-[420px] flex-1 overflow-hidden p-4 sm:p-8">
        <div className="pointer-events-none absolute left-5 top-4 font-mono text-[10px] uppercase tracking-[.14em] text-foreground/35 sm:left-8 sm:top-5">UPSTAGE</div>
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[.14em] text-foreground/35">DOWNSTAGE</div>
        <div className="flex h-full min-h-[390px] items-center justify-center overflow-auto">
          <div className={`relative w-full max-w-[920px] transition-transform duration-200 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`} style={{ aspectRatio: `${project.stageWidth} / ${project.stageHeight}`, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
            <div ref={surfaceRef} onPointerDown={onSurfacePointerDown} onPointerMove={onSurfacePointerMove} onPointerUp={onSurfacePointerUp} onPointerCancel={onSurfacePointerUp} className="stage-grid absolute inset-0 touch-none overflow-hidden rounded-xl border-[3px] border-[#3b3e53] shadow-2xl" style={{ ['--grid-size' as string]: `${Math.max(12, project.gridSize / 2)}px` }}>
              <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-white/15" />
              <div className="pointer-events-none absolute inset-y-0 left-1/2 border-l border-dashed border-white/15" />
              {showPaths && previous && (
                <svg viewBox={`0 0 ${project.stageWidth} ${project.stageHeight}`} className="pointer-events-none absolute inset-0 h-full w-full">
                  {dancers.map((dancer) => {
                    const current = getPosition(dancer.id);
                    const start = previous.positions.find((position) => position.dancerId === dancer.id);
                    return start ? <line key={dancer.id} x1={start.x} y1={start.y} x2={current.x} y2={current.y} stroke={dancer.color} strokeWidth={3} strokeDasharray="8 9" opacity=".62" /> : null;
                  })}
                </svg>
              )}
              {dancers.map((dancer) => {
                const position = getPosition(dancer.id);
                const isSelected = selectedDancerId === dancer.id;
                return (
                  <button
                    key={dancer.id}
                    data-token={`token-${dancer.id}`}
                    data-testid={`button-dancer-token-${dancer.id}`}
                    onClick={() => onSelectDancer(dancer.id)}
                    onPointerDown={(event) => { event.stopPropagation(); dragRef.current = { id: dancer.id, pointerId: event.pointerId }; onSelectDancer(dancer.id); event.currentTarget.setPointerCapture(event.pointerId); }}
                    style={{ left: `${(position.x / project.stageWidth) * 100}%`, top: `${(position.y / project.stageHeight) * 100}%`, backgroundColor: dancer.color }}
                    className={`token-shadow absolute grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 touch-none place-items-center rounded-full border-2 border-white/80 text-xs font-bold text-[#22263b] transition-[box-shadow,transform] duration-100 sm:h-14 sm:w-14 sm:text-sm ${isSelected ? 'z-20 scale-110 ring-4 ring-primary/50' : 'z-10 hover:scale-105'}`}
                  >
                    {dancer.initials}
                    <span className="absolute -bottom-5 max-w-20 truncate rounded bg-[#1b1e2f]/80 px-1.5 py-0.5 font-mono text-[9px] font-normal tracking-wide text-white">{dancer.name}</span>
                  </button>
                );
              })}
              <div className="pointer-events-none absolute left-3 top-3 rounded bg-[#171a2a]/55 px-2 py-1 font-mono text-[9px] text-white/60">STAGE / {selectedKeyframe?.name ?? 'No cue'}</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-lg border border-border bg-card/90 px-2 py-1.5 shadow-sm sm:left-8"><Grid3X3 size={13} className={gridSnap ? 'text-primary' : 'text-muted-foreground'} /><span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Snap</span><button aria-label="toggle grid snap" data-testid="button-toggle-grid-snap" onClick={() => setGridSnap(!gridSnap)} className={`relative h-5 w-9 rounded-full transition-colors ${gridSnap ? 'bg-primary' : 'bg-muted-foreground/30'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-primary-foreground transition-transform ${gridSnap ? 'right-0.5' : 'left-0.5'}`} /></button></div>
      </div>
    </section>
  );
}

function Timeline({ keyframes, selectedId, onSelect, onAdd, onDuplicate, onDelete, onMove }: { keyframes: Keyframe[]; selectedId?: string; onSelect: (id: string) => void; onAdd: () => void; onDuplicate: () => void; onDelete: () => void; onMove: (direction: 'up' | 'down') => void }) {
  return (
    <section className="border-t border-border bg-card px-4 py-3 sm:px-6">
      <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2"><Layers3 size={14} className="text-primary" /><span className="text-xs font-semibold">Cue timeline</span><span data-testid="text-keyframe-count" className="font-mono text-[10px] text-muted-foreground">{keyframes.length} {keyframes.length === 1 ? 'cue' : 'cues'}</span></div><div className="flex items-center gap-1"><IconButton label="move cue earlier" data-testid="button-move-cue-up" onClick={() => onMove('up')} disabled={!selectedId}><ArrowLeft size={14} /></IconButton><IconButton label="move cue later" data-testid="button-move-cue-down" onClick={() => onMove('down')} disabled={!selectedId}><ArrowRight size={14} /></IconButton><span className="mx-1 h-5 w-px bg-border" /><Button data-testid="button-duplicate-keyframe" onClick={onDuplicate} disabled={!selectedId} className="h-8 border-border bg-background text-xs"><Copy size={13} /> Duplicate</Button><IconButton label="delete cue" data-testid="button-delete-keyframe" onClick={onDelete} disabled={!selectedId} className="text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 size={15} /></IconButton></div></div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {keyframes.map((frame, index) => <button key={frame.id} data-testid={`button-keyframe-${frame.id}`} onClick={() => onSelect(frame.id)} className={`group flex min-w-[142px] items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors ${selectedId === frame.id ? 'border-primary bg-primary/10' : 'border-border bg-background hover:border-primary/50'}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-md font-mono text-[10px] ${selectedId === frame.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{String(index + 1).padStart(2, '0')}</span><span className="min-w-0"><span className="block truncate text-xs font-semibold">{frame.name}</span><span className="mt-0.5 block font-mono text-[9px] uppercase tracking-wide text-muted-foreground">{frame.positions.length} marks</span></span></button>)}
        <button data-testid="button-add-keyframe" onClick={onAdd} className="flex min-w-[142px] items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-foreground"><Plus size={14} /> Add cue</button>
      </div>
    </section>
  );
}

function Inspector({ dancers, selectedDancer, onSelectDancer, onAddDancer, onUpdateDancer, onDeleteDancer, project, onUpdateProject }: { dancers: Dancer[]; selectedDancer?: Dancer; onSelectDancer: (id: string) => void; onAddDancer: () => void; onUpdateDancer: (dancer: Dancer, data: { name: string; initials: string; color: string; role: string }) => void; onDeleteDancer: (id: string) => void; project: Project; onUpdateProject: (data: { name: string; description: string }) => void }) {
  const [name, setName] = useState(selectedDancer?.name ?? '');
  const [initials, setInitials] = useState(selectedDancer?.initials ?? '');
  const [color, setColor] = useState(selectedDancer?.color ?? colorSwatches[0]);
  const [role, setRole] = useState(selectedDancer?.role ?? '');
  const [description, setDescription] = useState(project.description ?? '');
  useEffect(() => { setName(selectedDancer?.name ?? ''); setInitials(selectedDancer?.initials ?? ''); setColor(selectedDancer?.color ?? colorSwatches[0]); setRole(selectedDancer?.role ?? ''); }, [selectedDancer]);
  useEffect(() => setDescription(project.description ?? ''), [project.description]);
  const saveDancer = () => selectedDancer && name.trim() && onUpdateDancer(selectedDancer, { name: name.trim(), initials: initials.trim().slice(0, 3).toUpperCase(), color, role: role.trim() });
  return (
    <aside className="flex w-full flex-col border-l border-border bg-card lg:w-[292px]">
      <div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-2 text-xs font-semibold"><PanelRight size={14} className="text-primary" /> Inspector</div><SlidersHorizontal size={14} className="text-muted-foreground" /></div>
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-8"><div className="mb-3 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Ensemble / {dancers.length}</span><IconButton label="add dancer" data-testid="button-add-dancer" onClick={onAddDancer} className="h-7 w-7 border border-border text-primary"><UserRoundPlus size={14} /></IconButton></div><div className="grid gap-1.5">{dancers.length === 0 && <div data-testid="empty-dancers" className="rounded-lg border border-dashed border-border p-4 text-center text-xs leading-5 text-muted-foreground">No dancers yet. Add the first mark to the floor.</div>}{dancers.map((dancer) => <button key={dancer.id} data-testid={`button-select-dancer-${dancer.id}`} onClick={() => onSelectDancer(dancer.id)} className={`flex items-center gap-3 rounded-lg border px-2.5 py-2 text-left transition-colors ${selectedDancer?.id === dancer.id ? 'border-primary/60 bg-primary/8' : 'border-transparent hover:border-border hover:bg-muted/60'}`}><span className="grid h-8 w-8 place-items-center rounded-full text-[10px] font-bold text-[#22263b]" style={{ backgroundColor: dancer.color }}>{dancer.initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold">{dancer.name}</span><span className="block truncate font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{dancer.role || 'Ensemble'}</span></span>{selectedDancer?.id === dancer.id && <ChevronRight size={14} className="text-primary" />}</button>)}</div></div>
        {selectedDancer ? <div className="border-t border-border pt-5"><div className="mb-4 flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-[#22263b]" style={{ backgroundColor: color }}>{initials || '?'}</span><div><div className="text-sm font-semibold">Token details</div><div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Edit selected mark</div></div></div><div className="grid gap-4"><Field label="Name" value={name} onChange={setName} testId="input-dancer-name" /><div className="grid grid-cols-[1fr_78px] gap-3"><Field label="Initials" value={initials} onChange={setInitials} testId="input-dancer-initials" /><label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Color<input data-testid="input-dancer-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1" /></label></div><Field label="Role / note" value={role} onChange={setRole} testId="input-dancer-role" placeholder="e.g. lead" /><div className="flex gap-2"><Button data-testid="button-save-dancer" onClick={saveDancer} className="h-9 flex-1 border-primary bg-primary text-xs text-primary-foreground hover:bg-primary/90"><Save size={13} /> Save token</Button><IconButton label="delete dancer" data-testid="button-delete-dancer" onClick={() => onDeleteDancer(selectedDancer.id)} className="h-9 w-9 border border-border text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 size={14} /></IconButton></div></div></div> : <div className="rounded-xl bg-muted/60 p-4"><div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Move size={14} className="text-primary" /> Place a dancer</div><p className="text-xs leading-5 text-muted-foreground">Select a token here or drag one across the stage. Positions save to the active cue.</p></div>}
        <div className="mt-8 border-t border-border pt-5"><div className="mb-3 flex items-center gap-2"><Settings2 size={14} className="text-primary" /><span className="font-mono text-[10px] uppercase tracking-[.16em] text-muted-foreground">Project note</span></div><textarea data-testid="input-project-description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-20 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-xs leading-5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /><Button data-testid="button-save-project-note" onClick={() => onUpdateProject({ name: project.name, description })} className="mt-2 h-8 w-full border-border bg-background text-xs hover:bg-muted"><Save size={13} /> Save project note</Button></div>
      </div>
    </aside>
  );
}

function AddDancerPanel({ onClose, onCreate, pending }: { onClose: () => void; onCreate: (data: { name: string; initials: string; color: string; role: string }) => void; pending: boolean }) {
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [color, setColor] = useState(colorSwatches[0]);
  const [role, setRole] = useState('');
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#1b1e2f]/35 p-5 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"><div className="mb-5 flex items-start justify-between"><div><div className="text-lg font-semibold">Add dancer token</div><p className="mt-1 text-xs text-muted-foreground">A mark to move through the scene.</p></div><IconButton label="close add dancer" data-testid="button-close-add-dancer" onClick={onClose}><ChevronDown size={17} /></IconButton></div><div className="grid gap-4"><Field label="Name" value={name} onChange={setName} testId="input-new-dancer-name" placeholder="e.g. Iris Chen" /><div className="grid grid-cols-[1fr_78px] gap-3"><Field label="Initials" value={initials} onChange={setInitials} testId="input-new-dancer-initials" placeholder="IC" /><label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Color<input data-testid="input-new-dancer-color" type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-10 w-full cursor-pointer rounded-md border border-input bg-background p-1" /></label></div><Field label="Role / note" value={role} onChange={setRole} testId="input-new-dancer-role" placeholder="e.g. soloist" /></div><Button data-testid="button-create-dancer" disabled={!name.trim() || !initials.trim() || pending} onClick={() => onCreate({ name: name.trim(), initials: initials.trim().slice(0, 3).toUpperCase(), color, role: role.trim() })} className="mt-6 h-11 w-full border-primary bg-primary text-primary-foreground hover:bg-primary/90">{pending ? 'Adding mark…' : 'Add to ensemble'}<Plus size={15} /></Button></div></div>;
}

function ProjectSettings({ project, onClose, onSave, pending }: { project: Project; onClose: () => void; onSave: (data: { name: string; description: string }) => void; pending: boolean }) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? '');
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#1b1e2f]/35 p-5 backdrop-blur-sm"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"><div className="mb-6 flex items-start justify-between"><div><div className="text-lg font-semibold">Project settings</div><p className="mt-1 text-xs text-muted-foreground">Name the rehearsal so the room knows what it is.</p></div><IconButton label="close project settings" data-testid="button-close-project-settings" onClick={onClose}><ChevronDown size={17} /></IconButton></div><div className="grid gap-4"><Field label="Project name" value={name} onChange={setName} testId="input-project-name" /><label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Description<textarea data-testid="input-project-settings-description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-24 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" /></label></div><div className="mt-6 flex justify-end gap-2"><Button data-testid="button-cancel-project-settings" onClick={onClose} className="border-border bg-background hover:bg-muted">Cancel</Button><Button data-testid="button-save-project-settings" disabled={!name.trim() || pending} onClick={() => onSave({ name: name.trim(), description })} className="border-primary bg-primary text-primary-foreground hover:bg-primary/90">{pending ? 'Saving…' : 'Save changes'}</Button></div></div></div>;
}

export default function Workspace() {
  const queryClient = useQueryClient();
  const projectsQuery = useListProjects();
  const projects = projectsQuery.data ?? [];
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [showAddDancer, setShowAddDancer] = useState(false);
  const [showProjectSettings, setShowProjectSettings] = useState(false);
  useEffect(() => { if (!selectedProjectId && projects[0]) setSelectedProjectId(projects[0].id); }, [projects, selectedProjectId]);
  if (projectsQuery.isLoading) return <LoadingWorkspace />;
  if (projectsQuery.isError) return <main className="grid min-h-[100dvh] place-items-center bg-background p-6"><div className="max-w-sm rounded-2xl border border-destructive/30 bg-card p-7 text-center"><div className="text-lg font-semibold">The project list missed its cue.</div><p className="mt-2 text-sm leading-6 text-muted-foreground">We could not load your rehearsals. Try once more.</p><Button data-testid="button-retry-projects" onClick={() => projectsQuery.refetch()} className="mt-5 border-primary bg-primary text-primary-foreground">Retry</Button></div></main>;
  if (showNewProject || projects.length === 0) return <NewProject onCreated={(project) => { setShowNewProject(false); setSelectedProjectId(project.id); queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() }); }} />;
  return <WorkspaceContent key={selectedProjectId} projects={projects} selectedProjectId={selectedProjectId} setSelectedProjectId={setSelectedProjectId} onNewProject={() => setShowNewProject(true)} showAddDancer={showAddDancer} setShowAddDancer={setShowAddDancer} showProjectSettings={showProjectSettings} setShowProjectSettings={setShowProjectSettings} />;
}

function WorkspaceContent({ projects, selectedProjectId, setSelectedProjectId, onNewProject, showAddDancer, setShowAddDancer, showProjectSettings, setShowProjectSettings }: { projects: Project[]; selectedProjectId: string; setSelectedProjectId: (id: string) => void; onNewProject: () => void; showAddDancer: boolean; setShowAddDancer: (value: boolean) => void; showProjectSettings: boolean; setShowProjectSettings: (value: boolean) => void }) {
  const queryClient = useQueryClient();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('stagecraft-theme') as 'light' | 'dark' | null) ?? 'light');
  const [railCollapsed, setRailCollapsed] = useState(projects.length <= 1);
  const query = useGetProject(selectedProjectId, { query: { queryKey: getGetProjectQueryKey(selectedProjectId), enabled: Boolean(selectedProjectId) } });
  const project = query.data?.project;
  const dancers = query.data?.dancers ?? [];
  const keyframes = useMemo(() => [...(query.data?.keyframes ?? [])].sort((a, b) => a.sortOrder - b.sortOrder), [query.data?.keyframes]);
  const [selectedKeyframeId, setSelectedKeyframeId] = useState('');
  const [selectedDancerId, setSelectedDancerId] = useState<string>();
  const [localPositions, setLocalPositions] = useState<Position[]>([]);
  const [gridSnap, setGridSnap] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [saveState, setSaveState] = useState('Saved');
  const initialized = useRef('');
  const invalidate = () => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(selectedProjectId) });
  const createDancer = useCreateDancer();
  const updateDancer = useUpdateDancer();
  const deleteDancer = useDeleteDancer();
  const createKeyframe = useCreateKeyframe();
  const updateKeyframe = useUpdateKeyframe();
  const deleteKeyframe = useDeleteKeyframe();
  const duplicateKeyframe = useDuplicateKeyframe();
  const reorderKeyframes = useReorderKeyframes();
  const updateProject = useUpdateProject();
  useEffect(() => { if (keyframes[0] && (!selectedKeyframeId || !keyframes.some((frame) => frame.id === selectedKeyframeId))) setSelectedKeyframeId(keyframes[0].id); }, [keyframes, selectedKeyframeId]);
  const selectedKeyframe = keyframes.find((frame) => frame.id === selectedKeyframeId);
  useEffect(() => { if (selectedKeyframe && initialized.current !== selectedKeyframe.id) { initialized.current = selectedKeyframe.id; setLocalPositions(selectedKeyframe.positions); } }, [selectedKeyframe]);
  useEffect(() => { if (!selectedDancerId || !dancers.some((dancer) => dancer.id === selectedDancerId)) setSelectedDancerId(dancers[0]?.id); }, [dancers, selectedDancerId]);
  if (query.isLoading || !project) return <LoadingWorkspace />;
  if (query.isError) return <main className="grid min-h-[100dvh] place-items-center bg-background p-6"><div className="max-w-sm rounded-2xl border border-destructive/30 bg-card p-7 text-center"><div className="text-lg font-semibold">This rehearsal is out of reach.</div><p className="mt-2 text-sm leading-6 text-muted-foreground">The workspace could not be opened.</p><Button data-testid="button-retry-workspace" onClick={() => query.refetch()} className="mt-5 border-primary bg-primary text-primary-foreground">Retry</Button></div></main>;
  const mutateAndRefresh = (action: () => void) => { setSaveState('Saving'); action(); };
  const moveDancer = (id: string, position: Position) => { setLocalPositions((current) => [...current.filter((item) => item.dancerId !== id), position]); };
  const savePosition = (dancerId: string) => {
    if (!selectedKeyframe) return;
    const nextPositions = [...localPositions.filter((position) => position.dancerId !== dancerId), localPositions.find((position) => position.dancerId === dancerId)!].filter(Boolean);
    mutateAndRefresh(() => updateKeyframe.mutate({ keyframeId: selectedKeyframe.id, data: { positions: nextPositions } }, { onSuccess: () => { setSaveState('Saved'); invalidate(); } }));
  };
  const createCue = () => {
    mutateAndRefresh(() => createKeyframe.mutate({ projectId: selectedProjectId, data: { name: `Cue ${String(keyframes.length + 1).padStart(2, '0')}`, positions: localPositions.length ? localPositions : dancers.map((dancer, index) => ({ dancerId: dancer.id, x: project.stageWidth * (.25 + (index % 4) * .17), y: project.stageHeight * (.35 + Math.floor(index / 4) * .22) })) } }, { onSuccess: (frame) => { setSelectedKeyframeId(frame.id); invalidate(); } }));
  };
  const updateProjectData = (data: { name: string; description: string }) => { mutateAndRefresh(() => updateProject.mutate({ projectId: selectedProjectId, data }, { onSuccess: () => { setSaveState('Saved'); setShowProjectSettings(false); queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() }); invalidate(); } })); };
  const selectedDancer = dancers.find((dancer) => dancer.id === selectedDancerId);
  const addDancer = (data: { name: string; initials: string; color: string; role: string }) => { mutateAndRefresh(() => createDancer.mutate({ projectId: selectedProjectId, data }, { onSuccess: (dancer) => { setSelectedDancerId(dancer.id); setShowAddDancer(false); setSaveState('Saved'); invalidate(); } })); };
  const editDancer = (dancer: Dancer, data: { name: string; initials: string; color: string; role: string }) => { mutateAndRefresh(() => updateDancer.mutate({ dancerId: dancer.id, data }, { onSuccess: () => { setSaveState('Saved'); invalidate(); } })); };
  const removeDancer = (id: string) => { if (!window.confirm('Remove this dancer from the project?')) return; mutateAndRefresh(() => deleteDancer.mutate({ dancerId: id }, { onSuccess: () => { setSelectedDancerId(undefined); setSaveState('Saved'); invalidate(); } })); };
  const duplicateCue = () => { if (!selectedKeyframe) return; mutateAndRefresh(() => duplicateKeyframe.mutate({ keyframeId: selectedKeyframe.id }, { onSuccess: (frame) => { setSelectedKeyframeId(frame.id); setSaveState('Saved'); invalidate(); } })); };
  const removeCue = () => { if (!selectedKeyframe || !window.confirm('Delete this cue?')) return; mutateAndRefresh(() => deleteKeyframe.mutate({ keyframeId: selectedKeyframe.id }, { onSuccess: () => { setSelectedKeyframeId(keyframes.find((frame) => frame.id !== selectedKeyframe.id)?.id ?? ''); setSaveState('Saved'); invalidate(); } })); };
  const moveCue = (direction: 'up' | 'down') => { if (!selectedKeyframe) return; const index = keyframes.findIndex((frame) => frame.id === selectedKeyframe.id); const target = direction === 'up' ? index - 1 : index + 1; if (target < 0 || target >= keyframes.length) return; const ids = keyframes.map((frame) => frame.id); [ids[index], ids[target]] = [ids[target], ids[index]]; mutateAndRefresh(() => reorderKeyframes.mutate({ projectId: selectedProjectId, data: { keyframeIds: ids } }, { onSuccess: () => { setSaveState('Saved'); invalidate(); } })); };

  const toggleTheme = () => setTheme((current) => {
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('stagecraft-theme', next);
    return next;
  });
  return (
    <main className={`noise min-h-[100dvh] bg-background p-0 text-foreground lg:p-4 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="mx-auto flex min-h-[100dvh] max-w-[1650px] flex-col overflow-hidden rounded-none border-border bg-card lg:grid lg:min-h-[calc(100dvh-2rem)] lg:grid-cols-[auto_minmax(0,1fr)] lg:border lg:shadow-lg">
        <ProjectRail projects={projects} selectedId={selectedProjectId} onSelect={setSelectedProjectId} onNew={onNewProject} collapsed={railCollapsed} onToggle={() => setRailCollapsed((current) => !current)} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Topbar project={project} onProjectSettings={() => setShowProjectSettings(true)} saveState={saveState} theme={theme} onToggleTheme={toggleTheme} />
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row"><div className="flex min-h-0 min-w-0 flex-1 flex-col"><StageBoard project={project} dancers={dancers} keyframes={keyframes} selectedKeyframe={selectedKeyframe} selectedDancerId={selectedDancerId} onSelectDancer={setSelectedDancerId} onMoveDancer={moveDancer} onCommitPosition={savePosition} gridSnap={gridSnap} setGridSnap={setGridSnap} zoom={zoom} setZoom={setZoom} pan={pan} setPan={setPan} /><Timeline keyframes={keyframes} selectedId={selectedKeyframeId} onSelect={(id) => { setSelectedKeyframeId(id); initialized.current = ''; }} onAdd={createCue} onDuplicate={duplicateCue} onDelete={removeCue} onMove={moveCue} /></div><Inspector dancers={dancers} selectedDancer={selectedDancer} onSelectDancer={setSelectedDancerId} onAddDancer={() => setShowAddDancer(true)} onUpdateDancer={editDancer} onDeleteDancer={removeDancer} project={project} onUpdateProject={updateProjectData} /></div>
        </div>
      </div>
      {showAddDancer && <AddDancerPanel onClose={() => setShowAddDancer(false)} onCreate={addDancer} pending={createDancer.isPending} />}
      {showProjectSettings && <ProjectSettings project={project} onClose={() => setShowProjectSettings(false)} onSave={updateProjectData} pending={updateProject.isPending} />}
    </main>
  );
}