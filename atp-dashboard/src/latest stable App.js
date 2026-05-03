import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const App = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subject, setSubject] = useState('Chemistry');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('verify');
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    setAnalysisData(null);
    setFile(null);
    setPreview(null);
    setActiveTab('verify');
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [subject]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setAnalysisData(null);
    }
  };

  const handleAnalyze = async () => {
    if (loading) return;
    if (!file) return alert(`Please upload a ${subject} lab photo.`);
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject.toLowerCase());

    try {
      const response = await axios.post('http://127.0.0.1:8000/analyze', formData);
      console.log("Subject:", subject, "Data Received:", response.data);
      setAnalysisData(response.data);
    } catch (error) {
      console.error("Backend Error:", error);
      alert("Check if engine.py is running.");
    } finally {
      setLoading(false);
    }
  };

  // --- RESILIENT DATA MAPPING ---
  const experiment = analysisData?.experiment_analysis || {};
  
  // Plan mapping
  const idcsra = experiment.experimental_plan_idcsra || experiment.plan || experiment.experimental_design || {};
  
  // Aggressive Quiz mapping for Bio/Physics
  // This checks the common locations for the quiz array across different engines
  const rawQuiz = experiment.paper_6_style_questions || 
                  experiment.quiz_questions || 
                  experiment.practice_questions ||
                  analysisData?.quiz || [];
  
  const quizData = Array.isArray(rawQuiz) ? rawQuiz : [];
  
  const equations = experiment.equations || {};

  const getTabs = () => {
    const baseTabs = ['verify', 'plan', 'observations'];
    if (subject === 'Chemistry') baseTabs.push('equations');
    baseTabs.push('quiz');
    return baseTabs;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black tracking-tighter text-white">
          ATP<span className="text-cyan-500">MASTER</span>
        </h1>
        
        <div className="flex bg-slate-900 p-1 rounded-full border border-slate-800">
          {['Chemistry', 'Biology', 'Physics'].map(s => (
            <button 
              key={s} 
              onClick={() => setSubject(s)}
              className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all ${subject === s ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: UPLOAD */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative group border-2 border-dashed border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30 hover:border-cyan-500/50 transition-colors h-80 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Lab Preview" className="w-full h-full object-contain p-6" />
            ) : (
              <div className="text-center text-slate-500">
                <p className="italic">Upload {subject} Photo</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${loading ? 'bg-slate-800 text-slate-600' : 'bg-white text-black hover:bg-cyan-400'}`}
          >
            {loading ? "Processing..." : `Analyze ${subject}`}
          </button>
        </div>

        {/* RIGHT: CONTENT */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col min-h-[550px] overflow-hidden">
          {!analysisData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 animate-pulse">
              <p className="text-xs font-bold uppercase tracking-widest">Awaiting {subject} Input...</p>
            </div>
          ) : (
            <>
              <div className="flex bg-slate-800/30 p-2 gap-1 border-b border-slate-800 overflow-x-auto">
                {getTabs().map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-8 overflow-y-auto max-h-[550px] space-y-6">
                
                {/* VERIFY */}
                {activeTab === 'verify' && (
                  <div className="animate-in fade-in">
                    <h2 className="text-2xl font-bold text-white mb-1">{experiment.title || "Experiment Detected"}</h2>
                    <p className="text-cyan-500 text-[10px] font-black uppercase tracking-widest mb-6">{experiment.focus_area || subject}</p>
                    <div className="grid gap-3">
                      {(experiment.reagents || experiment.materials || []).map((r, i) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
                          <span className="font-bold text-slate-200 text-sm">{r.name}</span>
                          <span className="text-[10px] text-cyan-500 font-mono">{r.concentration || r.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PLAN */}
                {activeTab === 'plan' && (
                  <div className="space-y-6 animate-in slide-in-from-right-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700">
                        <p className="text-[10px] font-black text-cyan-500 uppercase mb-2">Independent Variable</p>
                        <p className="text-sm font-bold text-white leading-snug">
                          {idcsra.independent_variable?.description || idcsra.independent_variable || "Standard Input"}
                        </p>
                      </div>
                      <div className="bg-slate-800/30 p-5 rounded-2xl border border-slate-700">
                        <p className="text-[10px] font-black text-purple-400 uppercase mb-2">Dependent Variable</p>
                        <p className="text-sm font-bold text-white leading-snug">
                          {idcsra.dependent_variable?.description || idcsra.dependent_variable || "Observation Reading"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20">
                      <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Control / Safety</p>
                      <p className="text-xs text-slate-300">{idcsra.safety_precaution || idcsra.control_variables || "Follow standard lab protocols."}</p>
                    </div>
                  </div>
                )}

                {/* OBSERVATIONS */}
                {activeTab === 'observations' && (
                  <div className="animate-in fade-in space-y-4">
                    <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-950/50 text-slate-500 uppercase text-[9px]">
                          <tr>
                            <th className="px-6 py-4">Sample</th>
                            <th className="px-6 py-4 text-right">Reading</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {(idcsra.sample_readings || []).map((row, i) => (
                            <tr key={i}>
                              <td className="px-6 py-4 text-slate-300">{row.input || row.sample}</td>
                              <td className="px-6 py-4 text-cyan-400 font-mono text-right font-bold">{row.output || row.reading}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* CHEMISTRY ONLY */}
                {activeTab === 'equations' && subject === 'Chemistry' && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4">
                    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
                      <p className="text-[10px] text-cyan-500 font-black mb-2 uppercase">Word Equation</p>
                      <p className="text-sm text-white font-medium italic">{equations.word || "N/A"}</p>
                    </div>
                    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
                      <p className="text-[10px] text-purple-400 font-black mb-2 uppercase">Chemical Equation</p>
                      <p className="text-sm text-white font-mono tracking-wider">{equations.chemical || "N/A"}</p>
                    </div>
                    {equations.half_equations && (
                      <div className="p-5 bg-blue-500/5 border border-blue-500/20 rounded-2xl">
                        <p className="text-[10px] text-blue-400 font-black mb-2 uppercase">Ionic Equations</p>
                        <p className="text-sm text-blue-100 font-mono">{equations.half_equations}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* QUIZ TAB */}
                {activeTab === 'quiz' && (
                  <div className="space-y-4 animate-in fade-in">
                    {quizData.length > 0 ? quizData.map((q, i) => (
                      <div key={i} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700">
                        <p className="text-sm font-bold text-white mb-3">Q: {q.question}</p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20">
                          <p className="text-[9px] text-emerald-500 font-black uppercase mb-2">Marking Scheme</p>
                          <ul className="space-y-1.5">
                            {(Array.isArray(q.marking_points) ? q.marking_points : [q.answer || q.marking_points]).map((point, pi) => (
                              <li key={pi} className="text-xs text-slate-400 flex gap-2">
                                <span className="text-emerald-500/50">•</span> {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-3xl">
                        <p className="text-slate-600 italic text-sm">No practice questions found in this analysis.</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;