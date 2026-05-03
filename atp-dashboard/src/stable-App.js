import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subject, setSubject] = useState('Chemistry');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('verify');

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
    if (!file) return alert("Please upload a lab photo.");
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', subject.toLowerCase());

    try {
      console.log("SENDING TO BACKEND:", { subject: subject.toLowerCase(), fileName: file.name });
      const response = await axios.post('http://127.0.0.1:8000/analyze', formData);
      setAnalysisData(response.data);
    } catch (error) {
      alert("Backend connection error.");
    } finally {
      setLoading(false);
    }
  };

  // --- MAPPING LAYER ---
  const experiment = analysisData?.experiment_analysis?.experiment_analysis || {};
  const idcsra = experiment.experimental_plan_idcsra || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-black tracking-tighter text-white">
          ATP<span className="text-cyan-500">MASTER</span>
        </h1>
        <div className="flex gap-2">
          {['Chemistry', 'Biology', 'Physics'].map(s => (
            <button 
              key={s} 
              onClick={() => setSubject(s)}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${subject === s ? 'bg-cyan-500 text-white' : 'bg-slate-800 text-slate-400'}`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT: INPUT */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative group border-2 border-dashed border-slate-800 rounded-3xl overflow-hidden bg-slate-900/50 hover:border-cyan-500/50 transition-colors">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-80 object-contain p-4" />
            ) : (
              <div className="h-80 flex flex-col items-center justify-center text-slate-600">
                <p className="italic">Drop lab photo here</p>
              </div>
            )}
            <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-colors disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Run SME Engine"}
          </button>
        </div>

        {/* RIGHT: RESULTS */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-2xl">
          {!analysisData ? (
            <div className="flex-1 flex items-center justify-center text-slate-700 animate-pulse">
              Awaiting data input...
            </div>
          ) : (
            <>
              <div className="flex bg-slate-800/50 p-2 gap-1 overflow-x-auto">
                {['verify', 'equations', 'plan', 'output', 'quiz'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === tab ? 'bg-slate-700 text-cyan-400 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-6 overflow-y-auto max-h-[600px] space-y-6">
                {/* VERIFY TAB */}
                {activeTab === 'verify' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white leading-tight">{experiment.title}</h2>
                      <p className="text-cyan-500 text-xs font-bold mt-1 uppercase tracking-tighter">{experiment.chemistry_focus}</p>
                    </div>
                    <div className="grid gap-3">
                      {(experiment.reagents || []).map((r, i) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-100">{r.name}</span>
                            {r.concentration && <span className="text-[10px] bg-slate-700 px-2 py-1 rounded text-cyan-400">{r.concentration}</span>}
                          </div>
                          {r.hazard_alert && <p className="text-xs text-red-400 mt-2 font-medium">⚠️ {r.hazard_alert}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EQUATIONS TAB */}
                {activeTab === 'equations' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-cyan-500 uppercase">Cathode (-)</span>
                        <p className="text-blue-200 font-mono text-sm mt-2">{experiment.balanced_chemical_equation?.cathode_reaction}</p>
                        <p className="text-slate-500 text-[10px] mt-1 italic">{experiment.word_equation?.cathode_reaction}</p>
                      </div>
                      <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                        <span className="text-[10px] font-black text-cyan-500 uppercase">Anode (+)</span>
                        <p className="text-blue-200 font-mono text-sm mt-2">{experiment.balanced_chemical_equation?.anode_reaction}</p>
                        <p className="text-slate-500 text-[10px] mt-1 italic">{experiment.word_equation?.anode_reaction}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* PLAN TAB */}
                {activeTab === 'plan' && (
                  <div className="space-y-4">
                    <div className="grid gap-4">
                      <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700">
                        <p className="text-[10px] font-bold text-cyan-500 uppercase mb-2">Independent Variable</p>
                        <p className="text-sm font-semibold">{idcsra.independent_variable?.description}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Range: {idcsra.independent_variable?.range_and_units}</p>
                      </div>
                      <div className="bg-slate-800/30 p-4 rounded-2xl border border-slate-700">
                        <p className="text-[10px] font-bold text-cyan-500 uppercase mb-2">Dependent Variable</p>
                        <p className="text-sm font-semibold">{idcsra.dependent_variable?.description}</p>
                        <p className="text-[10px] text-slate-400 mt-2 bg-slate-950 p-2 rounded">Precision: {idcsra.dependent_variable?.instrument_and_precision}</p>
                      </div>
                      <div className="p-4">
                        <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Fixed Controls</p>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {(idcsra.controls || []).map((c, i) => (
                            <li key={i} className="text-[11px] flex items-center gap-2 text-slate-400">
                              <span className="w-1 h-1 bg-cyan-500 rounded-full"></span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
                        <p className="text-[10px] font-bold text-red-400 uppercase mb-1">Safety Protocol</p>
                        <p className="text-xs font-bold text-red-200">{idcsra.safety?.hazard_from_image}</p>
                        <p className="text-xs text-slate-400 mt-1 italic">{idcsra.safety?.corresponding_precaution}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* OUTPUT TAB */}
                {activeTab === 'output' && (
                  <div className="space-y-4">
                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700">
                      <h4 className="text-xs font-bold text-white mb-2 uppercase">Repeat Procedure</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{idcsra.repeat}</p>
                    </div>
                    <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700">
                      <h4 className="text-xs font-bold text-white mb-2 uppercase">Averaging Method</h4>
                      <p className="text-sm text-slate-400 leading-relaxed">{idcsra.average}</p>
                    </div>
                  </div>
                )}

                {/* QUIZ TAB */}
                {activeTab === 'quiz' && (
                  <div className="space-y-4">
                    {(experiment.paper_6_style_questions || []).map((q, i) => (
                      <div key={i} className="bg-slate-800/40 p-5 rounded-3xl border border-slate-700">
                        <div className="flex gap-4">
                          <span className="text-cyan-500 font-black text-xl">Q{i+1}</span>
                          <div>
                            <p className="text-sm font-bold text-white mb-4 leading-snug">{q.question}</p>
                            <div className="space-y-2">
                              {(q.marking_points || []).map((m, j) => (
                                <div key={j} className="text-[11px] text-slate-400 bg-slate-950/50 p-2 rounded-lg border border-slate-800 flex justify-between">
                                  <span>{m}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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