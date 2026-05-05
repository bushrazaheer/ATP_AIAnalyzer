import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const App = () => {

  const [isStarted, setIsStarted] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [subject, setSubject] = useState('Chemistry');
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [activeTab, setActiveTab] = useState('verify');
  
  const fileInputRef = useRef(null);
  const downloadPDF = () => {
  // Use the data variables defined in the component scope
  const pdf = new jsPDF();
  const date = new Date().toLocaleDateString();
  let y = 20; // Vertical cursor position

  // --- Header Section ---
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(22);
  pdf.setTextColor(0, 157, 196); // Cyan-ish color
  pdf.text("NEURALAB ATP REPORT", 15, y);
  
  y += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`Subject: ${subject.toUpperCase()} | Date: ${date}`, 15, y);
  
  y += 5;
  pdf.line(15, y, 195, y); // Horizontal separator

  // --- 1. Experiment Overview ---
  y += 15;
  pdf.setFontSize(14);
  pdf.setTextColor(0);
  pdf.text("1. Experiment Identification", 15, y);
  
  y += 8;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.text(`Title: ${experiment.title || "Subject Analysis"}`, 15, y);

  if (reagents.length > 0) {
    y += 10;
    pdf.setFont("helvetica", "bold");
    pdf.text("Detected Reagents:", 15, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    reagents.forEach((r) => {
      pdf.text(`• ${r.name} (${r.concentration})`, 20, y);
      y += 6;
    });
  }

  // --- 2. Experimental Plan (IDCSRA) ---
  y += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("2. Experimental Plan (IDCSRA)", 15, y);
  
  y += 8;
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("Independent Variable:", 15, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${idcsra.independent_variable?.description || "N/A"}`, 60, y);

  y += 8;
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "Italic");
  pdf.text("range_and_units:", 15, y);
  pdf.setFont("helvetica", "Italic");
  //pdf.text(`${idcsra.independent_variable?.description || "N/A"}`, 60, y);
  pdf.text(`${idcsra.independent_variable?.range_and_units || "N/A"}`, 60, y);
  
  y += 8;
  pdf.setFont("helvetica", "bold");
  pdf.text("Dependent Variable:", 15, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${idcsra.dependent_variable?.description || "N/A"}`, 60, y);

  y += 8;
  pdf.setFont("helvetica", "Italic");
  pdf.text("instrument_and_precision:", 15, y);
  
  pdf.setFont("helvetica", "Italic");
  //pdf.text(`${idcsra.dependent_variable?.description || "N/A"}`, 60, y);
pdf.text(`${idcsra.dependent_variable?.instrument_and_precision || "N/A"}`, 70, y);

  // --- 3. Chemistry Equations (If Applicable) ---
  if (subject === 'Chemistry' && equations) {
    y += 15;
    pdf.setFont("helvetica", "bold");
    pdf.text("3. Chemical Equations", 15, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.text(`Word: ${equations.word || "N/A"}`, 15, y);
    y += 6;
    pdf.text(`Symbol: ${equations.chemical || "N/A"}`, 15, y);
  }

  // --- 4. Sample Exam Questions ---
  y += 15;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.text("4. Sample Exam Questions", 15, y);
  y += 8;

  quizData.forEach((q, i) => {
    if (y > 250) { pdf.addPage(); y = 20; } // Automatic page breaking
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(`Q${i+1}: ${q.question}`, 15, y);
    y += 6;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(80);
    pdf.text(`Marking Scheme: ${q.marking_points?.join(", ")}`, 15, y);
    y += 12;
    pdf.setTextColor(0);
  });

  // Save the PDF
  pdf.save(`NEURALAB_${subject}_Report.pdf`);
};
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
      const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
      const allowedExtensions = ['png', 'jpg', 'jpeg'];

      if (!allowedExtensions.includes(fileExtension)) {
        alert("Unsupported format. Please upload a .png or .jpg image.");
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setAnalysisData(null);
    }
  };

  const handleAnalyze = async () => {
  if (loading) return;
  if (!file) return alert(`Please upload a ${subject} lab.`);

  setLoading(true);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject.toLowerCase());

  try {
    const response = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/analyze`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();
    setAnalysisData(data);

    console.log("FULL ANALYSIS OBJECT:", data);
  } catch (error) {
    console.error(error);
    alert("Backend connection error.");
  } finally {
    setLoading(false);
  }
    // Add this inside your handleAnalyze function after getting the response
console.log("FULL ANALYSIS OBJECT:", JSON.stringify(analysisData, null, 2));
  };
  const handleSubjectChange = (newSubject) => {
  if (analysisData) {
    const confirmChange = window.confirm(
      "Switching subjects will clear your current lab data. Do you want to proceed?"
    );
    if (!confirmChange) return;
  }
  setSubject(newSubject);
};

  // Step 1: Access the root of the analysis
const experiment = analysisData?.experiment_analysis || {};
// This defines 'idcsra' so Line 71 won't crash
const idcsra = experiment.experimental_plan_idcsra || {};
// Step 2: Access the IDCSRA plan
const plan = experiment.experimental_plan_idcsra || {};

// Step 3: Access the equations
const equations = experiment.equations || {};
  const quizData = experiment.paper_6_style_questions || [];
  const reagents = experiment.reagents || [];

  const getTabs = () => {
    const baseTabs = ['verify', 'plan', 'observations'];
    if (subject === 'Chemistry') baseTabs.push('equations');
    baseTabs.push('Sample Exam Questions'); // Updated title
    return baseTabs;
  };
  
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in slide-in-from-left-8 duration-700">
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
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1000&auto=format&fit=crop" 
              alt="Advanced Learning" 
              className="relative rounded-[2rem] border border-slate-800 shadow-2xl"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div key={subject} className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
  <h1 
    className="text-2xl font-black tracking-tighter text-white cursor-pointer group"
    onClick={() => setIsStarted(false)}
  >
    NEURA<span className="text-cyan-500 transition-colors group-hover:text-cyan-300">LAB</span>
    <span className="text-xs ml-1 text-slate-500 font-bold tracking-widest uppercase">atp</span>
  </h1>
  
  <div className="flex bg-slate-900 p-1 rounded-full border border-slate-800">
    {/* FIND THIS BLOCK BELOW */}
    {['Chemistry', 'Biology', 'Physics'].map(s => (
      <button 
        key={s} 
        onClick={() => handleSubjectChange(s)} // UPDATED HANDLER
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
        <div className="lg:col-span-5 space-y-6">
          <div className="relative group border-2 border-dashed border-slate-800 rounded-3xl overflow-hidden bg-slate-900/30 hover:border-cyan-500/50 transition-colors h-80 flex items-center justify-center">
            {preview ? (
              <img src={preview} alt="Preview" className="w-full h-full object-contain p-6" />
            ) : (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                   <svg className="w-12 h-12 text-slate-700 group-hover:text-cyan-500/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                   </svg>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-500 italic">Click or Drag {subject} Lab</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">PNG</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">JPG</span>
                  </div>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept=".png, .jpg, .jpeg" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
          </div>
          
          <button 
            onClick={handleAnalyze} 
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${loading ? 'bg-slate-800 text-slate-600 animate-pulse' : 'bg-white text-black hover:bg-cyan-400'}`}
          >
            {loading ? "Neural Processing..." : `Analyze ${subject} Lab`}
          </button>
        </div>

        <div className="lg:col-span-7 bg-slate-900 rounded-3xl border border-slate-800 flex flex-col min-h-[550px] overflow-hidden shadow-2xl">
          {!analysisData ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-700 space-y-4">
               <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500/20 rounded-full animate-spin"></div>
               <p className="uppercase font-bold text-xs tracking-widest animate-pulse">Awaiting Signal Input...</p>
            </div>
          ) : (
            <>
            {/* ADD THE DOWNLOAD BUTTON HERE */}
      <div id="analysis-results" className="px-8 pt-4 flex justify-end">
        <button 
          onClick={downloadPDF}
          className="flex items-center gap-2 text-[10px] font-bold text-cyan-500 hover:text-cyan-300 uppercase tracking-widest bg-slate-800/50 px-3 py-2 rounded-lg border border-slate-700 transition-all active:scale-95"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"/>
          </svg>
          Export Lab Report (PDF)
        </button>
      </div>
              <div className="flex bg-slate-800/30 p-2 gap-1 border-b border-slate-800 overflow-x-auto">
                {getTabs().map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-cyan-400 border border-slate-700' : 'text-slate-500'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="p-8 overflow-y-auto max-h-[550px] space-y-6">
                {activeTab === 'verify' && (
                  <div className="animate-in fade-in">
                    <h2 className="text-2xl font-bold text-white mb-6">{experiment.title || "Analysis Complete"}</h2>
                    <div className="grid gap-3">
                      {(experiment.reagents || []).map((r, i) => (
                        <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex justify-between">
                          <span className="font-bold text-sm text-slate-300">{r.name}</span>
                          <span className="text-xs text-cyan-500 font-mono">{r.concentration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* {activeTab === 'plan' && (
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
                )} */}

              {activeTab === 'plan' && (
  <div className="space-y-6">
    {/* Independent Variable Section */}
    <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700">
      <p className="text-[10px] font-black text-cyan-500 uppercase mb-1">Independent Variable</p>
      <p className="text-sm font-bold text-white">
        {idcsra.independent_variable?.description || "N/A"}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        <span className="font-semibold">Range & Units:</span> {idcsra.independent_variable?.range_and_units || "N/A"}
      </p>
    </div>

    {/* Dependent Variable Section */}
    <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700">
      <p className="text-[10px] font-black text-cyan-500 uppercase mb-1">Dependent Variable</p>
      <p className="text-sm font-bold text-white">
        {idcsra.dependent_variable?.description || "N/A"}
      </p>
      <p className="text-xs text-slate-400 mt-1">
        <span className="font-semibold">Instrument & Precision:</span> {idcsra.dependent_variable?.instrument_and_precision || "N/A"}
      </p>
    </div>

    {/* Controls Section */}
    <div className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700">
      <p className="text-[10px] font-black text-cyan-500 uppercase mb-2">Controlled Variables</p>
      <ul className="list-disc list-inside space-y-1">
        {idcsra.controls?.map((control, index) => (
          <li key={index} className="text-xs text-white">{control}</li>
        )) || <li className="text-xs text-white">N/A</li>}
      </ul>
    </div>

    {/* Technical Notes Section */}
    <div className="p-5 bg-slate-800/30 rounded-2xl border border-cyan-500/20">
      <p className="text-[10px] font-black text-cyan-400 uppercase mb-1">Technical Notes</p>
      <p className="text-xs leading-relaxed text-slate-300">
        {idcsra.technical_notes || "N/A"}
      </p>
    </div>
  </div>
)}

                {activeTab === 'observations' && (
                  <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-950/50 text-[9px] uppercase text-slate-500 font-black">
                        <tr><th className="px-6 py-4">Sample</th><th className="px-6 py-4 text-right">Observation</th></tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {idcsra.sample_readings?.map((row, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 text-slate-300">{row.input}</td>
                            <td className="px-6 py-4 text-cyan-400 font-mono text-right font-bold">{row.output}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* {activeTab === 'equations' && subject === 'Chemistry' && (
  <div className="space-y-4 animate-in slide-in-from-bottom-4">
    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
      <p className="text-[10px] text-cyan-500 font-black uppercase mb-2">Word Equation</p>
      <p className="text-sm italic text-white">{equations.word || "N/A"}</p>
    </div>
    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
      <p className="text-[10px] text-purple-400 font-black uppercase mb-2">Symbol Equation</p>
      <p className="text-sm font-mono text-white">{equations.chemical || "N/A"}</p>
    </div>
  </div>
)} */}

{activeTab === 'equations' && (
  
  <div className="space-y-4">
    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
      <p className="text-[10px] text-cyan-500 font-black uppercase mb-2">Word Equation</p>
      <p className="text-white">
  {JSON.parse(`"${equations.word_equation}"`)}
</p>
      <p className="text-sm italic text-white">
        {equations.word || "N/A"}
      </p>
    </div>
    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
      <p className="text-[10px] text-cyan-500 font-black uppercase mb-2">Ionic Half-Equations</p>
      {equations.ionic_half_equations?.map((eq, i) => (
        <p key={i} className="text-sm font-mono text-white mb-2 last:mb-0">{eq}</p>
      )) || <p className="text-white text-sm">N/A</p>}
    </div>
    
    <div className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl">
      <p className="text-[10px] text-cyan-500 font-black uppercase mb-2">Balanced Equation</p>
   
<p className="text-white">
  {JSON.parse(`"${equations.balanced_chemical}"`)}
</p>
    </div>
  </div>
)}

                {activeTab === 'Sample Exam Questions' && (
                  <div className="space-y-4 animate-in fade-in">
                    {quizData.length > 0 ? quizData.map((q, i) => (
                      <div key={i} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700">
                        <p className="text-sm font-bold text-white mb-3">Q: {q.question}</p>
                        <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20">
                          <p className="text-[9px] text-emerald-500 font-black uppercase mb-2">Marking Scheme</p>
                          <ul className="space-y-1">
                            {q.marking_points?.map((point, pi) => (
                              <li key={pi} className="text-xs text-slate-400 flex gap-2">
                                <span className="text-emerald-500">•</span> {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-10 opacity-50 italic">No practice questions found.</div>
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