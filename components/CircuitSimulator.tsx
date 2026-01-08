
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Component, Connection, CircuitData } from '../types';

interface SimulatorProps {
  onSimulationUpdate?: (data: CircuitData) => void;
  initialData?: CircuitData;
  isReadOnly?: boolean;
}

const COMPONENT_TYPES = [
  { type: 'resistor', label: 'Resistor', defaultValue: 100, unit: 'Ω', color: '#60a5fa' },
  { type: 'voltage_source', label: 'V-Source', defaultValue: 10, unit: 'V', color: '#facc15' },
  { type: 'ground', label: 'Ground', defaultValue: 0, unit: '', color: '#94a3b8' },
  { type: 'led', label: 'LED', defaultValue: 2.1, unit: 'V', color: '#f87171' }
];

const ComponentIcon = ({ type, color }: { type: string, color: string }) => {
  switch (type) {
    case 'resistor':
      return (
        <svg width="60" height="20" viewBox="0 0 60 20" fill="none" stroke={color} strokeWidth="2">
          <path d="M0 10H15L18 4L24 16L30 4L36 16L42 4L45 10H60" />
        </svg>
      );
    case 'voltage_source':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="2">
          <circle cx="20" cy="20" r="15" />
          <path d="M20 12V20M16 16H24M16 26H24" strokeWidth="3" />
        </svg>
      );
    case 'ground':
      return (
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke={color} strokeWidth="2">
          <path d="M15 0V15M5 15H25M8 20H22M12 25H18" />
        </svg>
      );
    case 'led':
      return (
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="2">
          <path d="M10 20H30M20 10L30 20L20 30V10M10 10V30" />
          <path d="M28 8L34 2M22 6L28 0" strokeWidth="1" />
        </svg>
      );
    default:
      return null;
  }
};

export const CircuitSimulator: React.FC<SimulatorProps> = ({ 
  onSimulationUpdate, 
  initialData, 
  isReadOnly = false 
}) => {
  const [components, setComponents] = useState<Component[]>(initialData?.components || []);
  const [connections, setConnections] = useState<Connection[]>(initialData?.connections || []);
  
  const [history, setHistory] = useState<{ components: Component[], connections: Connection[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ components: Component[], connections: Connection[] }[]>([]);

  const [draggingComp, setDraggingComp] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTerminal, setActiveTerminal] = useState<{ id: string; terminal: 'A' | 'B' } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showEditor, setShowEditor] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const saveState = useCallback(() => {
    setHistory(prev => [...prev, { components, connections }]);
    setRedoStack([]);
  }, [components, connections]);

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [...prev, { components, connections }]);
    setComponents(previous.components);
    setConnections(previous.connections);
    setHistory(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(prev => [...prev, { components, connections }]);
    setComponents(next.components);
    setConnections(next.connections);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const addComponent = (type: any) => {
    if (isReadOnly) return;
    saveState();
    const newId = `comp-${Date.now()}`;
    const newComp: Component = {
      id: newId,
      type: type.type,
      value: type.defaultValue,
      x: 200,
      y: 200,
      rotation: 0,
      label: type.label + ' ' + (components.length + 1)
    };
    setComponents(prev => [...prev, newComp]);
    setSelectedId(newId);
    setShowEditor(true);
  };

  const deleteSelected = useCallback(() => {
    if (!selectedId || isReadOnly) return;
    saveState();
    setComponents(c => c.filter(x => x.id !== selectedId));
    setConnections(cn => cn.filter(x => x.fromId !== selectedId && x.toId !== selectedId));
    setSelectedId(null);
    setShowEditor(false);
  }, [selectedId, isReadOnly, saveState]);

  const clearAll = () => {
    if (isReadOnly || !window.confirm("Are you sure you want to clear the entire circuit?")) return;
    saveState();
    setComponents([]);
    setConnections([]);
    setSelectedId(null);
    setShowEditor(false);
    setActiveTerminal(null);
  };

  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    if (isReadOnly) return;
    e.stopPropagation();
    setDraggingComp(id);
    setSelectedId(id);
    const comp = components.find(c => c.id === id);
    if (comp) setOffset({ x: e.clientX - comp.x, y: e.clientY - comp.y });
  };

  const handleTerminalClick = (e: React.MouseEvent, id: string, terminal: 'A' | 'B') => {
    e.stopPropagation();
    if (activeTerminal) {
      if (activeTerminal.id !== id) {
        saveState();
        const newConn: Connection = {
          id: `conn-${Date.now()}`,
          fromId: activeTerminal.id,
          fromTerminal: activeTerminal.terminal as any,
          toId: id,
          toTerminal: terminal as any
        };
        setConnections(prev => [...prev, newConn]);
      }
      setActiveTerminal(null);
    } else {
      setActiveTerminal({ id, terminal });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (draggingComp) {
      setComponents(prev => prev.map(c => 
        c.id === draggingComp 
          ? { ...c, x: e.clientX - offset.x, y: e.clientY - offset.y } 
          : c
      ));
    }
  }, [draggingComp, offset]);

  const handleMouseUp = useCallback(() => setDraggingComp(null), []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && !isReadOnly && document.activeElement?.tagName !== 'INPUT') {
        deleteSelected();
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') { e.preventDefault(); undo(); }
        if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) { e.preventDefault(); redo(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, isReadOnly, deleteSelected]);

  useEffect(() => {
    if (onSimulationUpdate) onSimulationUpdate({ components, connections });
  }, [components, connections, onSimulationUpdate]);

  const getTerminalCoords = (id: string, terminal: 'A' | 'B') => {
    const comp = components.find(c => c.id === id);
    if (!comp) return { x: 0, y: 0 };
    const width = 100, height = 80;
    const isVertical = comp.rotation === 90 || comp.rotation === 270;
    if (terminal === 'A') return { x: comp.x + (isVertical ? width / 2 : 0), y: comp.y + (isVertical ? 0 : height / 2) };
    return { x: comp.x + (isVertical ? width / 2 : width), y: comp.y + (isVertical ? height : height / 2) };
  };

  const selectedComp = components.find(c => c.id === selectedId);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
      <div className="bg-slate-800/80 border-b border-slate-700 p-2 flex items-center justify-between z-30">
        <div className="flex gap-2">
          {COMPONENT_TYPES.map(ct => (
            <button
              key={ct.type}
              onClick={() => addComponent(ct)}
              disabled={isReadOnly}
              className="group p-2 bg-slate-900 hover:bg-blue-600 rounded-lg border border-slate-700 transition-all flex flex-col items-center justify-center w-16 h-16 active:scale-95 disabled:opacity-50"
              title={`Add ${ct.label}`}
            >
              <div className="scale-75 group-hover:invert group-hover:brightness-0">
                <ComponentIcon type={ct.type} color={ct.color} />
              </div>
              <span className="text-[8px] font-black uppercase mt-1 text-slate-500 group-hover:text-white">{ct.label}</span>
            </button>
          ))}
        </div>

        <div className="flex gap-1 items-center bg-slate-950/40 p-1 rounded-xl border border-slate-700/50">
          <button onClick={undo} disabled={history.length === 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-20 transition-all flex flex-col items-center gap-0.5" title="Undo (Ctrl+Z)">
            <i className="fa-solid fa-rotate-left"></i>
            <span className="text-[7px] font-black uppercase">Undo</span>
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2 text-slate-400 hover:text-white disabled:opacity-20 transition-all flex flex-col items-center gap-0.5" title="Redo (Ctrl+Y)">
            <i className="fa-solid fa-rotate-right"></i>
            <span className="text-[7px] font-black uppercase">Redo</span>
          </button>
          <div className="w-px h-6 bg-slate-700 mx-1"></div>
          <button onClick={deleteSelected} disabled={!selectedId || isReadOnly} className="p-2 text-slate-400 hover:text-red-400 disabled:opacity-20 transition-all flex flex-col items-center gap-0.5" title="Delete Selected">
            <i className="fa-solid fa-trash-can"></i>
            <span className="text-[7px] font-black uppercase">Delete</span>
          </button>
          <button onClick={clearAll} disabled={isReadOnly} className="p-2 text-slate-400 hover:text-red-600 disabled:opacity-20 transition-all flex flex-col items-center gap-0.5" title="Clear Canvas">
            <i className="fa-solid fa-fire"></i>
            <span className="text-[7px] font-black uppercase">Clear All</span>
          </button>
        </div>

        <div className="flex gap-2 items-center">
          {selectedComp && (
            <button 
              onClick={() => setShowEditor(!showEditor)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2 ${showEditor ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
              <i className="fa-solid fa-sliders"></i> {showEditor ? 'CLOSE EDITOR' : 'EDIT VALUE'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex relative overflow-hidden bg-slate-950">
        <div 
          ref={canvasRef}
          className="flex-1 relative cursor-crosshair bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:25px_25px]"
          onClick={() => { setSelectedId(null); setActiveTerminal(null); setShowEditor(false); }}
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {connections.map(conn => {
              const start = getTerminalCoords(conn.fromId, conn.fromTerminal as any);
              const end = getTerminalCoords(conn.toId, conn.toTerminal as any);
              return <line key={conn.id} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#10b981" strokeWidth="2.5" className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]" />;
            })}
            {activeTerminal && (
              <line x1={getTerminalCoords(activeTerminal.id, activeTerminal.terminal).x} y1={getTerminalCoords(activeTerminal.id, activeTerminal.terminal).y} 
                    x2={mousePos.x - (canvasRef.current?.getBoundingClientRect().left || 0)} 
                    y2={mousePos.y - (canvasRef.current?.getBoundingClientRect().top || 0)} 
                    stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,4" className="animate-[dash_1s_linear_infinite]" />
            )}
          </svg>

          {components.map(comp => (
            <div
              key={comp.id}
              onMouseDown={(e) => handleMouseDown(e, comp.id)}
              style={{ left: comp.x, top: comp.y, transform: `rotate(${comp.rotation}deg)`, width: '100px', height: '80px' }}
              className={`absolute flex items-center justify-center transition-all ${selectedId === comp.id ? 'bg-blue-500/10 border-2 border-blue-500 rounded-xl' : ''}`}
            >
              <div className="relative pointer-events-none flex flex-col items-center">
                <ComponentIcon type={comp.type} color={COMPONENT_TYPES.find(ct => ct.type === comp.type)?.color || '#fff'} />
                <div className="absolute top-14 bg-slate-900/80 px-1.5 rounded border border-slate-700/50 flex flex-col items-center">
                   <span className="text-[7px] font-black text-slate-400 uppercase leading-none mt-1">{comp.label}</span>
                   <span className="text-[9px] font-mono text-blue-300">{comp.value}{COMPONENT_TYPES.find(ct => ct.type === comp.type)?.unit}</span>
                </div>
              </div>
              <div onClick={(e) => handleTerminalClick(e, comp.id, 'A')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-400 border border-slate-900 cursor-pointer hover:bg-blue-500"></div>
              <div onClick={(e) => handleTerminalClick(e, comp.id, 'B')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-slate-400 border border-slate-900 cursor-pointer hover:bg-blue-500"></div>
            </div>
          ))}
        </div>

        {selectedComp && showEditor && (
          <div className="w-64 bg-slate-900 border-l border-slate-800 p-4 shadow-2xl animate-in slide-in-from-right-4 z-40">
            <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest mb-4">Edit Component</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Label</label>
                <input type="text" value={selectedComp.label} onChange={(e) => { saveState(); setComponents(c => c.map(x => x.id === selectedId ? { ...x, label: e.target.value } : x)) }} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Value ({COMPONENT_TYPES.find(ct => ct.type === selectedComp.type)?.unit})</label>
                <input type="number" value={selectedComp.value} onChange={(e) => { saveState(); setComponents(c => c.map(x => x.id === selectedId ? { ...x, value: parseFloat(e.target.value) || 0 } : x)) }} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-2">Orientation</label>
                <div className="grid grid-cols-4 gap-1">
                  {[0, 90, 180, 270].map(r => (
                    <button key={r} onClick={() => { saveState(); setComponents(c => c.map(x => x.id === selectedId ? { ...x, rotation: r } : x)) }} className={`p-1.5 rounded text-[10px] border ${selectedComp.rotation === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>{r}°</button>
                  ))}
                </div>
              </div>
              <button onClick={deleteSelected} className="w-full py-2 mt-4 bg-red-950/20 text-red-500 border border-red-900/30 rounded text-[10px] font-black hover:bg-red-600 hover:text-white transition-all">DELETE COMPONENT</button>
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes dash { to { stroke-dashoffset: -8; } }`}</style>
    </div>
  );
};
