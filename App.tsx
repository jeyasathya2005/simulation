
import React, { useState, useEffect } from 'react';
import { User, Topic, Question, Difficulty, CircuitData } from './types';
import { INITIAL_TOPICS } from './constants';
import { CircuitSimulator } from './components/CircuitSimulator';
import { solveCircuit } from './CircuitEngine';

// --- AUTH COMPONENT ---
const Auth: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [role, setRole] = useState<'admin' | 'student'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (role === 'admin') {
      if (email === 'admin@gmail.com' && password === '123456') {
        onLogin({ id: 'admin-1', email: 'admin@gmail.com', role: 'admin', progress: {} });
      } else {
        setError('Invalid admin credentials.');
      }
    } else {
      if (!email || !password) { setError('Please fill all fields'); return; }
      onLogin({ id: 'std-' + Date.now(), email, role: 'student', progress: {} });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="max-w-md w-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-10 text-center bg-slate-800/50 border-b border-slate-800">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl"><i className="fa-solid fa-microchip text-3xl text-white"></i></div>
          <h1 className="text-3xl font-black text-white">CircuitLab</h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Enterprise Edition</p>
        </div>
        <form onSubmit={handleLogin} className="p-10 space-y-6">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button type="button" onClick={() => setRole('student')} className={`py-2 rounded-lg text-xs font-black tracking-widest transition-all ${role === 'student' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>STUDENT</button>
            <button type="button" onClick={() => setRole('admin')} className={`py-2 rounded-lg text-xs font-black tracking-widest transition-all ${role === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>FACULTY</button>
          </div>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-4 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500" />
          {error && <p className="text-red-400 text-xs font-bold bg-red-950/20 p-3 rounded-lg border border-red-900/40">{error}</p>}
          <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 text-xs tracking-widest">SIGN IN TO PORTAL</button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [lastSimData, setLastSimData] = useState<CircuitData | null>(null);
  const [feedback, setFeedback] = useState<{ status: 'PASS' | 'FAIL' | null; message: string; accuracy?: number }>({ status: null, message: '' });
  const [view, setView] = useState<'dashboard' | 'simulation' | 'roster' | 'editor'>('dashboard');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('circuit_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedTopics = localStorage.getItem('circuit_topics');
    setTopics(savedTopics ? JSON.parse(savedTopics) : INITIAL_TOPICS);
  }, []);

  useEffect(() => {
    if (topics.length > 0) localStorage.setItem('circuit_topics', JSON.stringify(topics));
  }, [topics]);

  // UI Effect: Automatically collapse/hide main sidebar when entering simulation mode
  useEffect(() => {
    if (view === 'simulation') {
      setIsSidebarExpanded(false);
    } else {
      setIsSidebarExpanded(true);
    }
  }, [view]);

  const handleLogin = (u: User) => { setUser(u); setView('dashboard'); localStorage.setItem('circuit_user', JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); setView('dashboard'); localStorage.removeItem('circuit_user'); };

  const handleSubmit = () => {
    if (!activeTopic) return;
    const q = activeTopic.questions[activeQuestionIndex];
    if (!q || !lastSimData) return;
    const res = solveCircuit(lastSimData.components, lastSimData.connections);
    if (!res.success) { setFeedback({ status: 'FAIL', message: res.error || "Check wiring." }); return; }
    let passed = true;
    let accuracy = 100;
    if (q.correctCriteria.expectedCurrentThrough) {
      const val = res.currents[q.correctCriteria.expectedCurrentThrough.componentId] || 0;
      const err = Math.abs(val - q.correctCriteria.expectedCurrentThrough.value);
      if (err > q.correctCriteria.tolerance) passed = false;
      accuracy = Math.max(0, 100 * (1 - err / (q.correctCriteria.expectedCurrentThrough.value || 1)));
    }
    if (passed) {
      setFeedback({ status: 'PASS', accuracy, message: "Excellent work! Logic verified." });
      if (user?.role === 'student') {
        const newProgress = Math.max(user.progress[activeTopic.id] || 0, activeQuestionIndex + 1);
        const u = { ...user, progress: { ...user.progress, [activeTopic.id]: newProgress } };
        setUser(u); localStorage.setItem('circuit_user', JSON.stringify(u));
      }
    } else {
      setFeedback({ status: 'FAIL', accuracy, message: "Accuracy too low. Re-check resistor values." });
    }
  };

  const updateTopic = (id: string, updates: Partial<Topic>) => {
    setTopics(ts => ts.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const updateQuestion = (topicId: string, qId: string, updates: Partial<Question>) => {
    setTopics(ts => ts.map(t => t.id === topicId ? { ...t, questions: t.questions.map(q => q.id === qId ? { ...q, ...updates } : q) } : t));
  };

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-200">
      {/* Left Navigation Sidebar - Collapsible to "move back" */}
      <aside className={`transition-all duration-300 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 shadow-2xl relative ${isSidebarExpanded ? 'w-64' : 'w-14'}`}>
        <button 
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-8 z-50 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg text-[10px]"
        >
          <i className={`fa-solid ${isSidebarExpanded ? 'fa-chevron-left' : 'fa-chevron-right'}`}></i>
        </button>

        <div className={`p-6 ${!isSidebarExpanded && 'px-3'}`}>
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-bolt text-blue-500 text-xl"></i>
            {isSidebarExpanded && <span className="font-black tracking-tighter text-lg">CircuitLab</span>}
          </div>
        </div>

        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'} ${!isSidebarExpanded && 'justify-center'}`} title="Dashboard">
            <i className="fa-solid fa-house-chimney text-xs"></i>
            {isSidebarExpanded && <span className="ml-3 text-[10px] font-black uppercase tracking-widest">HOME</span>}
          </button>
          
          {user.role === 'admin' ? (
            <>
              <button onClick={() => setView('roster')} className={`w-full flex items-center p-3 rounded-xl transition-all ${view === 'roster' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'} ${!isSidebarExpanded && 'justify-center'}`} title="Student Roster">
                <i className="fa-solid fa-users text-xs"></i>
                {isSidebarExpanded && <span className="ml-3 text-[10px] font-black uppercase tracking-widest">ROSTER</span>}
              </button>
              {isSidebarExpanded && <div className="pt-6 pb-2 px-3 text-[9px] font-black text-slate-600 tracking-widest uppercase">Content Editor</div>}
              {topics.map(t => (
                <button key={t.id} onClick={() => { setEditingTopicId(t.id); setView('editor'); }} className={`w-full flex items-center p-3 rounded-xl transition-all ${editingTopicId === t.id && view === 'editor' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500'} ${!isSidebarExpanded && 'justify-center'}`} title={`Edit ${t.name}`}>
                  <i className="fa-solid fa-pen-to-square text-xs"></i>
                  {isSidebarExpanded && <span className="ml-3 text-[10px] font-bold truncate">{t.name}</span>}
                </button>
              ))}
            </>
          ) : (
            <>
              {isSidebarExpanded && <div className="pt-6 pb-2 px-3 text-[9px] font-black text-slate-600 tracking-widest uppercase">Learning Modules</div>}
              {topics.map(t => (
                <button key={t.id} onClick={() => { setActiveTopic(t); setView('simulation'); setActiveQuestionIndex(user.progress[t.id] || 0); setFeedback({ status: null, message: '' }); }} className={`w-full flex items-center p-3 rounded-xl transition-all ${activeTopic?.id === t.id && view === 'simulation' ? 'bg-blue-600/10 text-blue-400' : 'text-slate-500'} ${!isSidebarExpanded && 'justify-center'}`} title={t.name}>
                  <i className="fa-solid fa-atom text-xs"></i>
                  {isSidebarExpanded && (
                    <div className="ml-3 overflow-hidden text-left">
                      <div className="text-[10px] font-bold truncate leading-none mb-1">{t.name}</div>
                      <div className="text-[8px] opacity-60">{user.progress[t.id] || 0}/{t.questions.length} DONE</div>
                    </div>
                  )}
                </button>
              ))}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className={`w-full flex items-center p-2 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all ${!isSidebarExpanded && 'justify-center'}`} title="Logout">
            <i className="fa-solid fa-power-off text-xs"></i>
            {isSidebarExpanded && <span className="ml-2 text-[10px] font-black uppercase">LOGOUT</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {view === 'dashboard' && (
          <div className="p-12 max-w-5xl mx-auto w-full overflow-y-auto">
            <h1 className="text-4xl font-black mb-4">Welcome, {user.role === 'admin' ? 'Faculty' : 'Student'}</h1>
            <p className="text-slate-500 mb-12">Portal Status: <span className="text-emerald-500 font-bold uppercase text-[10px]">Secure & Online</span> • Current User: {user.email}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Academic Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl"><div className="text-2xl font-black text-blue-500">{topics.length}</div><div className="text-[9px] font-bold text-slate-500 uppercase">Total Modules</div></div>
                  <div className="p-4 bg-slate-950 rounded-2xl"><div className="text-2xl font-black text-emerald-500">100%</div><div className="text-[9px] font-bold text-slate-500 uppercase">Uptime Status</div></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-lg shadow-blue-900/20">
                <h3 className="text-xl font-black text-white mb-2">New Simulation Tools</h3>
                <p className="text-sm text-blue-100 mb-6 font-medium">Enhanced schematic symbols, undo/redo, and live faculty content editing now available.</p>
                <button className="px-6 py-2 bg-white text-blue-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md">LEARN MORE</button>
              </div>
            </div>
          </div>
        )}

        {view === 'roster' && (
          <div className="p-12 overflow-y-auto">
            <h2 className="text-2xl font-black mb-8 uppercase tracking-tighter flex items-center gap-3">
              <i className="fa-solid fa-users text-blue-500"></i> Student Performance Roster
            </h2>
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                    <th className="p-6">Student Email</th>
                    <th className="p-6">Role Type</th>
                    <th className="p-6">Academic Progress</th>
                    <th className="p-6">Connectivity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-6 font-bold text-sm">sample_student@skillrack.com</td>
                    <td className="p-6"><span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 uppercase tracking-tighter">STUDENT</span></td>
                    <td className="p-6 text-xs text-slate-400">Ohm's Law: 3/5 • KVL: 1/5 • KCL: 0/5</td>
                    <td className="p-6"><div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> <span className="text-[10px] uppercase font-bold text-emerald-500">Online</span></div></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'editor' && editingTopicId && (
          <div className="p-12 overflow-y-auto flex-1">
            {topics.filter(t => t.id === editingTopicId).map(t => (
              <div key={t.id} className="max-w-4xl mx-auto space-y-12">
                <section className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Topic Configuration</h3>
                    <button className="text-[9px] font-black bg-blue-600/10 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded uppercase">Preview Simulator</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Topic Name</label><input type="text" value={t.name} onChange={e => updateTopic(t.id, { name: e.target.value })} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-white outline-none focus:border-blue-500 font-bold" /></div>
                    <div><label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Tutorial Video URL</label><input type="text" value={t.tutorialUrl} onChange={e => updateTopic(t.id, { tutorialUrl: e.target.value })} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-white outline-none focus:border-blue-500 font-mono text-xs" /></div>
                  </div>
                </section>
                <div className="space-y-6">
                  <h3 className="text-xl font-black flex items-center gap-3">Assessment Tasks <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-500">{t.questions.length}</span></h3>
                  {t.questions.map(q => (
                    <div key={q.id} className="bg-slate-900 p-8 rounded-3xl border border-slate-800 hover:border-blue-500/30 transition-all shadow-xl group">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <input type="text" value={q.title} onChange={e => updateQuestion(t.id, q.id, { title: e.target.value })} className="text-lg font-black bg-transparent w-full text-white outline-none focus:text-blue-400" />
                          <textarea value={q.description} onChange={e => updateQuestion(t.id, q.id, { description: e.target.value })} className="w-full bg-slate-950 p-4 rounded-xl border border-slate-800 text-sm text-slate-400 min-h-[100px] outline-none focus:border-slate-700" />
                        </div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 shadow-inner">
                          <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Auto-Verification Metrics</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-[9px] font-black text-slate-500 uppercase">Expected Current (A)</label><input type="number" step="0.01" value={q.correctCriteria.expectedCurrentThrough?.value} onChange={e => updateQuestion(t.id, q.id, { correctCriteria: { ...q.correctCriteria, expectedCurrentThrough: { componentId: 'main', value: parseFloat(e.target.value) } } })} className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs text-white font-mono" /></div>
                            <div><label className="text-[9px] font-black text-slate-500 uppercase">Margin of Error</label><input type="number" step="0.001" value={q.correctCriteria.tolerance} onChange={e => updateQuestion(t.id, q.id, { correctCriteria: { ...q.correctCriteria, tolerance: parseFloat(e.target.value) } })} className="w-full bg-slate-900 border border-slate-800 p-2 rounded text-xs text-white font-mono" /></div>
                          </div>
                          <div className="flex gap-3 items-center">
                            <div className="flex-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase block mb-1">Difficulty Level</label>
                               <select value={q.difficulty} onChange={e => updateQuestion(t.id, q.id, { difficulty: e.target.value as Difficulty })} className="w-full bg-slate-900 p-2 rounded text-[10px] font-black uppercase text-blue-400 border border-slate-800"><option>Easy</option><option>Medium</option><option>Hard</option></select>
                            </div>
                            <button className="mt-5 p-2 text-red-500/50 hover:text-red-500 transition-colors"><i className="fa-solid fa-trash-can"></i></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="w-full py-4 border-2 border-dashed border-slate-800 rounded-3xl text-slate-600 hover:text-blue-500 hover:border-blue-500/50 transition-all font-black text-xs tracking-widest uppercase">+ Add New Task Requirement</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'simulation' && activeTopic && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Simulation Header */}
            <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between shadow-lg z-20">
              <div className="flex gap-2">
                {activeTopic.questions.map((q, i) => (
                  <button 
                    key={q.id} 
                    disabled={user.role === 'student' && i > (user.progress[activeTopic.id] || 0)} 
                    onClick={() => { setActiveQuestionIndex(i); setFeedback({ status: null, message: '' }); }} 
                    className={`w-10 h-10 rounded-xl font-black text-xs border transition-all ${activeQuestionIndex === i ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-6">
                 <div className="text-right">
                    <div className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Active Module</div>
                    <div className="text-xs font-bold text-white">{activeTopic.name}</div>
                 </div>
                 <button onClick={handleSubmit} className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2">
                   <i className="fa-solid fa-play"></i> RUN VERIFICATION
                 </button>
              </div>
            </header>

            {/* Simulation Workspace Split View */}
            <div className="flex-1 flex overflow-hidden">
              {/* Question Tab (STILL / FIXED) */}
              <div className="w-80 bg-slate-900 border-r border-slate-800 p-8 overflow-y-auto shrink-0 animate-in slide-in-from-left-4 duration-500">
                <div className="inline-block bg-blue-600/10 text-blue-500 text-[9px] font-black px-2 py-1 rounded border border-blue-500/20 uppercase tracking-widest mb-4">
                  Task Specification #{activeQuestionIndex + 1}
                </div>
                <h1 className="text-2xl font-black text-white mb-6 leading-tight tracking-tighter">
                  {activeTopic.questions[activeQuestionIndex].title}
                </h1>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Objective</h3>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      {activeTopic.questions[activeQuestionIndex].description}
                    </p>
                  </div>

                  {activeTopic.tutorialUrl && (
                    <a href={activeTopic.tutorialUrl} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl group hover:bg-red-950/30 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                        <i className="fa-solid fa-play text-xs"></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Learning Support</span>
                        <span className="text-[11px] font-bold text-red-400">Watch Tutorial Video</span>
                      </div>
                    </a>
                  )}

                  {feedback.status && (
                    <div className={`mt-8 p-6 rounded-2xl border-2 animate-in zoom-in-95 duration-300 ${feedback.status === 'PASS' ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300 shadow-[0_0_30px_rgba(16,185,129,0.1)]' : 'bg-red-950/30 border-red-500/50 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.1)]'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <i className={`fa-solid ${feedback.status === 'PASS' ? 'fa-circle-check' : 'fa-circle-xmark'} text-xl`}></i>
                          <span className="text-[11px] font-black uppercase tracking-widest">{feedback.status}</span>
                        </div>
                        <span className="text-[10px] bg-slate-950 px-2 py-1 rounded font-mono border border-white/5">{feedback.accuracy?.toFixed(1)}% ACC</span>
                      </div>
                      <p className="text-[11px] font-bold leading-relaxed">{feedback.message}</p>
                      {feedback.status === 'PASS' && activeQuestionIndex < activeTopic.questions.length - 1 && user.role === 'student' && (
                        <button 
                          onClick={() => { setActiveQuestionIndex(prev => prev + 1); setFeedback({ status: null, message: '' }); }}
                          className="w-full mt-4 py-2 bg-emerald-600 text-white rounded-lg font-black text-[10px] tracking-widest uppercase hover:bg-emerald-500 transition-colors shadow-lg"
                        >
                          Next Requirement <i className="fa-solid fa-arrow-right ml-2"></i>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Simulator Component (FLEXIBLE / FLEX-1) */}
              <div className="flex-1 bg-slate-950 relative">
                <CircuitSimulator onSimulationUpdate={setLastSimData} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
