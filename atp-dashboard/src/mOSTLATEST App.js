import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const App = () => {
  // State to toggle between Landing Page and Main App
  const [isStarted, setIsStarted] = useState(false);
  
  // Existing App States
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subject, setSubject] = useState('Chemistry');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('verify');
  
  const fileInputRef = useRef(null);

  // Reset state when switching subjects to avoid "stale state"
  useEffect(() => {
    setAnalysisData(null);
    setFile(null);
    setPreview(null);
    setActiveTab('verify');
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [subject]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Get the file extension
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['png', 'jpg', 'jpeg'];

      if (!allowedExtensions.includes(fileExtension)) {
        alert("Invalid file type. Please upload a .png or .jpg image.");
        e.target.value = ""; // Clear the input
        return;
      }

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
      setAnalysisData(response.data);
    } catch (error) {
      alert("Backend connection error. Ensure engine.py is running.");
    } finally {
      setLoading(false);
    }
  };

  const experiment = analysisData?.experiment_analysis || {};
  const idcsra = experiment.experimental_plan_idcsra || {};
  const equations = experiment.equations || {};
  const quizData = experiment.paper_6_style_questions || [];

  const getTabs = () => {
    const baseTabs = ['verify', 'plan', 'observations'];
    if (subject === 'Chemistry') baseTabs.push('equations');
    baseTabs.push('Sample Exam Questions'); // Updated from 'quiz'
    return baseTabs;
  };

  // --- 1. LANDING PAGE VIEW ---
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-8 animate-in slide-in-from-left-8 duration-700">
            {/* AI Influential Title/Logo */}
            <h1 className="text-7xl font-black tracking-tighter text-white">
              NEURA<span className="text-cyan-500">LAB</span>
              <span className="text-2xl ml-2 text-slate-500 font-light tracking-[0.2em]">ATP</span>
            </h1>
            
            <div className="space-y-4">
              <h2 className="text-4xl font-bold leading-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
                Cognitive Vision. <br/> 
                Mastering the Science of Practicality.
              </h2>
              <p className="text-xl text-slate-400 font-light max-w-lg leading-relaxed">
                Deploying advanced <span className="text-cyan-400 font-bold">Machine Perception</span> to decode your lab work into high-yield exam insights and Paper 6 mastery.
              </p>
              <p className="text-lg text-slate-500 italic">
                Bridge the gap between raw experimental data and exam-ready analysis instantly.
              </p>
            </div>
            
            <button 
              onClick={() => setIsStarted(true)}
              className="group relative bg-white text-black px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-cyan-400 transition-all transform hover:scale-105 active:scale-95 shadow-2xl shadow-cyan-500/20"
            >
              <span className="relative z-10">Lets Get Started</span>
              <div className="absolute inset-0 bg-cyan-400 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
            </button>
          </div>

          <div className="relative animate-in zoom-in-95 duration-1000">
            <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -inset-1 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-[2rem] blur opacity-20"></div>
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop" 
              alt="Advanced Learning" 
              className="relative rounded-[2rem] border border-slate-800 shadow-2xl grayscale-[10%] hover:grayscale-0 transition-all duration-700"
            />
          </div>

        </div>
      </div>
    );
  }

  // --- 2. MAIN APP VIEW ---
  return (
    <div key={subject} className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
  {/* Corrected Logo and Branding */}
  <h1 
    className="text-2xl font-black tracking-tighter text-white cursor-pointer group"
    onClick={() => setIsStarted(false)}
  >
    NEURA<span className="text-cyan-500 transition-colors group-hover:text-cyan-300">LAB</span>
    <span className="text-xs ml-1 text-slate-500 font-bold tracking-widest uppercase">atp</span>
  </h1>
  
  {/* Subject Navigation */}
  <div className="flex bg-slate-900 p-1 rounded-full border border-slate-800">
    {['Chemistry', 'Biology', 'Physics'].map(s => (
      <button 
        key={s} 
        onClick={() => setSubject(s)}
        className={`px-6 py-1.5 rounded-full text-xs font-bold transition-all ${
          subject === s 
            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' 
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        {s.toUpperCase()}
      </button>
    ))}
  </div>
</header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Upload Section */}
        {/* Upload Section */}
<div className="lg:col-span-5 space-y-6">
  <div className="relative group border-2 border-dashed border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30 hover:border-cyan-500/50 transition-colors h-80 flex items-center justify-center">
    {preview ? (
      <img src={preview} alt="Preview" className="w-full h-full object-contain p-6" />
    ) : (
      <div className="text-center space-y-4">
        {/* Upload Icon or Illustration */}
        <div className="flex justify-center">
           <svg className="w-12 h-12 text-slate-700 group-hover:text-cyan-500/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
           </svg>
        </div>
        
        <div className="space-y-2">
          <p className="text-slate-500 italic">Click or Drag {subject} Lab Photo</p>
          
          {/* THE NEW UI INDICATOR */}
          <div className="flex items-center justify-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">PNG</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">JPG</span>
          </div>
        </div>
        
        <p className="text-[10px] text-slate-700 uppercase font-bold tracking-widest underline decoration-cyan-500/30">
          Computer Vision Ready
        </p>
      </div>
    )}
    
    {/* Added the 'accept' attribute here for native browser filtering */}
    <input 
      ref={fileInputRef} 
      type="file" 
      accept=".png, .jpg, .jpeg" 
      onChange={handleFileChange} 
      className="absolute inset-0 opacity-0 cursor-pointer" 
    />
  </div>
  
 
          
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${loading ? 'bg-slate-800 text-slate-600 animate-pulse' : 'bg-white text-black hover:bg-cyan-400 hover:shadow-cyan-500/10'}`}
          >
            {loading ? "Neural Processing..." : `Analyze ${subject} Lab`}
          </button>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col min-h-[550px] overflow-hidden shadow-2xl">
          {!analysisData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 space-y-4">
               <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500/20 rounded-full animate-spin"></div>
               <p className="uppercase font-bold text-xs tracking-widest animate-pulse">Awaiting Signal Input...</p>
            </div>
          ) : (
            <>
              <div className="flex bg-slate-800/30 p-2 gap-1 border-b border-slate-800 overflow-x-auto">
                {getTabs().map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === tab ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-500 hover:text-slate-400'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-8 overflow-y-auto max-h-[550px] space-y-6">
                {activeTab === 'verify' && (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <h2 className="text-2xl font-bold text-white mb-6">{experiment.title || "Subject Analysis"}</h2>
                    <div className="grid gap-3">
                      {(experiment.reagents || []).map((r, i) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex justify-between items-center group hover:border-cyan-500/30 transition-colors">
                          <span className="font-bold text-sm text-slate-300 group-hover:text-white transition-colors">{r.name}</span>
                          <span className="text-xs text-cyan-500 font-mono bg-cyan-500/5 px-3 py-1 rounded-full">{r.concentration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'plan' && (
                  <div className="space-y-4 animate-in slide-in-from-right-2">
                    <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700">
                      <p className="text-[10px] font-black text-cyan-500 uppercase mb-1">Independent Variable</p>
                      <p className="text-sm font-bold text-white">{idcsra.independent_variable?.description || "N/A"}</p>
                    </div>
                    <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700">
                      <p className="text-[10px] font-black text-purple-400 uppercase mb-1">Dependent Variable</p>
                      <p className="text-sm font-bold text-white">{idcsra.dependent_variable?.description || "N/A"}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'observations' && (
                  <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950/50 text-[9px] uppercase text-slate-500 font-black">
                        <tr><th className="px-6 py-4">Sample / Input</th><th className="px-6 py-4 text-right">Observation Output</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {idcsra.sample_readings?.map((row, i) => (
                          <tr key={i} className="hover:bg-cyan-500/5 transition-colors">
                            <td className="px-6 py-4 text-slate-300">{row.input}</td>
                            <td className="px-6 py-4 text-cyan-400 font-mono text-right font-bold">{row.output}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'equations' && subject === 'Chemistry' && (
                  <div className="space-y-4 animate-in slide-in-from-bottom-4">
                    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
                      <p className="text-[10px] text-cyan-500 font-black uppercase mb-2">Word Equation</p>
                      <p className="text-sm italic text-slate-200">{equations.word || "N/A"}</p>
                    </div>
                    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
                      <p className="text-[10px] text-purple-400 font-black uppercase mb-2">Symbol Equation</p>
                      <p className="text-sm font-mono text-slate-200">{equations.chemical || "N/A"}</p>
                    </div>
                  </div>
                )}

                {/* Replace 'quiz' with 'Sample Exam Questions' */}
                {activeTab === 'Sample Exam Questions' && (
                  <div className="space-y-4 animate-in fade-in">
                    {quizData.length > 0 ? quizData.map((q, i) => (
                      <div key={i} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700 group">
                        <p className="text-sm font-bold text-white mb-3">Q: {q.question}</p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                          <p className="text-[9px] text-emerald-500 font-black uppercase mb-2">Marking Scheme Insight</p>
                          <ul className="space-y-1">
                            {q.marking_points?.map((point, pi) => (
                              <li key={pi} className="text-xs text-slate-400 flex gap-2">
                                <span className="text-emerald-500 font-bold">•</span> {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-10 opacity-30 italic text-sm">Synthetic questions not available for this set.</div>
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