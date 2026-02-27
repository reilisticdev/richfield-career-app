"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '../../lib/supabase'; 
import ReactMarkdown from 'react-markdown'; 

// 100% Accurate Mapping of Richfield Programmes to their specific Majors/Focus Areas
const programMajorsMapping = {
  "Bachelor of Science in Information Technology": [
    "Programming", 
    "Emerging Technologies", 
    "IT Management", 
    "Network Engineering", 
    "Business Analysis"
  ],
  "Diploma in Information Technology": [
    "Programming", 
    "Network Engineering", 
    "Business Analysis"
  ],
  "Bachelor of Business Administration (BBA)": [
    "Accounting", 
    "Human Resource Management", 
    "Marketing Management", 
    "Supply Chain Management"
  ],
  "Diploma in Business Administration": [
    "Economics", 
    "Public Management", 
    "Human Resource Management", 
    "Supply Chain Management"
  ],
  "Bachelor of Commerce (BCom) - Route 1 (AGA)": [
    "Taxation", 
    "Financial Management & Managerial Accounting", 
    "Auditing and Assurance"
  ]
};

export default function ResultsScreen() {
  const router = useRouter();
  const chatEndRef = useRef(null);
  
  const [userData, setUserData] = useState(null);
  const [userVector, setUserVector] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap"); 
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  
  const [roadmapData, setRoadmapData] = useState(null);
  const [pivotData, setPivotData] = useState(null);
  const [postgradData, setPostgradData] = useState(null);
  
  // Interactive State for Majors
  const [availableMajors, setAvailableMajors] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const [dreamJobInput, setDreamJobInput] = useState("");
  const [postgradSelect, setPostgradSelect] = useState("");
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your **Richfield AI Advisor**. Ask me anything about your modules, career paths, or industry certifications!" }
  ]);

  // Main Fetch Logic
  const fetchRoadmap = async (scores, program, major) => {
    try {
      const response = await fetch("http://127.0.0.1:5000/api/match", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, program, selected_major: major }),
      });
      
      if (!response.ok) throw new Error(`Backend Error: Server returned status ${response.status}`);
      
      const responseText = await response.text();
      const aiData = JSON.parse(responseText);
      setRoadmapData(aiData);
      
      // Save to DB
      const dbId = localStorage.getItem('student_db_id');
      if (dbId) await supabase.from('student_leads').update({ psych_scores: scores, roadmap_result: aiData }).eq('id', dbId); 
      
    } catch (error) {
        console.error("Fetch Error:", error);
        alert("The AI Architect encountered a server error. Please ensure your Python backend is running.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let localUser, localVector;

        if (session) {
          const { data: dbData } = await supabase.from('student_leads').select('*').eq('email', session.user.email).single();
          if (dbData) {
            localUser = { firstName: dbData.first_name, program: dbData.current_program };
            localVector = dbData.psych_scores;
          }
        } else {
          const storedUser = localStorage.getItem("richfieldUser");
          const storedVector = localStorage.getItem("userVector");
          if (!storedUser || !storedVector) { router.push("/"); return; }
          localUser = JSON.parse(storedUser);
          localVector = JSON.parse(storedVector);
        }

        setUserData(localUser); 
        setUserVector(localVector);

        // Map the correct major list, if applicable to the selected degree
        const majors = programMajorsMapping[localUser.program];
        let initialMajor = null;
        
        if (majors && majors.length > 0) {
          setAvailableMajors(majors);
          initialMajor = majors[0]; // Set default to first major
          setSelectedMajor(initialMajor);
        } else {
          setAvailableMajors(null);
          setSelectedMajor(null);
        }

        await fetchRoadmap(localVector, localUser.program, initialMajor);

      } catch (err) { 
        console.error(err); 
      } finally { 
        setIsLoading(false); 
      }
    };
    loadData();
  }, [router]);

  useEffect(() => { if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" }); }, [chatMessages, isChatOpen]);

  const handleMajorToggle = async (major) => {
    if (major === selectedMajor) return;
    setSelectedMajor(major);
    setIsRecalculating(true);
    setPivotData(null); 
    setPostgradData(null);
    try {
      await fetchRoadmap(userVector, userData.program, major);
    } catch (err) { console.error(err); } finally { setIsRecalculating(false); }
  };

  const handlePivot = async (e) => {
    e.preventDefault(); setIsActionLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/pivot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scores: userVector, program: userData.program, selected_major: selectedMajor, dream_job: dreamJobInput }) });
      if (!res.ok) throw new Error("Server error.");
      setPivotData(await res.json());
    } catch (err) { console.error(err); alert("Failed to generate analysis."); } finally { setIsActionLoading(false); }
  };

  const handlePostgrad = async (e) => {
    e.preventDefault(); setIsActionLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/postgrad", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ program: userData.program, selected_major: selectedMajor, scores: userVector, postgrad_choice: postgradSelect }) });
      if (!res.ok) throw new Error("Server error.");
      setPostgradData(await res.json());
    } catch (err) { console.error(err); alert("Failed to generate ROI."); } finally { setIsActionLoading(false); }
  };

  const handleChat = async (e) => {
    e.preventDefault(); if (!chatInput.trim()) return;
    const msg = chatInput; setChatInput(""); setChatMessages(p => [...p, { role: "user", content: msg }]); setIsChatLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: msg, program: userData.program, selected_major: selectedMajor, scores: userVector }) });
      const data = await res.json(); setChatMessages(p => [...p, { role: "assistant", content: data.response }]);
    } catch { setChatMessages(p => [...p, { role: "assistant", content: "Connection error." }]); } finally { setIsChatLoading(false); }
  };

  const handleRetake = async () => {
    await supabase.auth.signOut(); 
    localStorage.removeItem("userVector");
    localStorage.clear(); 
    router.push("/");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  const renderModulesList = (semesterData) => {
    if (Array.isArray(semesterData)) {
      return (
        <ul className="space-y-2 mt-2">
          {semesterData.map((mod, idx) => (
            <li key={idx} className="text-sm font-medium text-slate-700 flex items-start gap-2">
              <span className="text-blue-500 mt-0.5 font-black">•</span> 
              <span className="leading-snug">{mod}</span>
            </li>
          ))}
        </ul>
      );
    }
    return <p className="text-sm font-medium text-slate-700 whitespace-pre-line leading-relaxed mt-2">{semesterData}</p>;
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans">
      <div className="w-20 h-20 border-8 border-blue-500 border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(59,130,246,0.5)]"></div>
      <h2 className="text-3xl font-black tracking-widest uppercase">Extracting Prospectus Data</h2>
      <p className="text-blue-400 mt-2 font-medium">Mapping your psychometric vector...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans pb-32 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-3xl mx-auto">
        
        {/* Header Block */}
        <div className="text-center mb-8 bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight">Your Roadmap, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{userData?.firstName}</span></h1>
          <div className="inline-block bg-slate-900 text-white px-5 py-2.5 rounded-full font-bold text-sm tracking-wide shadow-md">
            {userData?.program}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          {[{id: 'roadmap', label: 'CORE ROADMAP'}, {id: 'pivot', label: 'DREAM PIVOT'}, {id: 'postgrad', label: 'POSTGRAD ROI'}].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} 
              className={`flex-1 py-4 px-6 font-black rounded-2xl border-2 transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === t.id ? 'bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.02]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB 1: CORE ROADMAP */}
        {activeTab === "roadmap" && (
          <div className="space-y-8 animate-in fade-in duration-500 relative">
            
            {/* Loading Overlay for Major Toggle */}
            {isRecalculating && (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-[2rem]">
                <div className="w-16 h-16 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h3 className="text-2xl font-black text-slate-900">Recalculating Trajectory...</h3>
                <p className="text-slate-600 font-bold">Applying {selectedMajor} context.</p>
              </div>
            )}

            {/* --- HORIZONTAL ALIGNED INTERACTIVE MAJOR TOGGLE BOARD --- */}
            {availableMajors && (
              <div className="bg-white rounded-[2rem] shadow-xl p-6 sm:p-10 border border-slate-100 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  Select Focus Area (Major)
                </h2>
                <p className="text-sm font-medium text-slate-500 mb-6">Toggling your major will dynamically recalculate your career matches and restructure your modules based on the Prospectus.</p>
                
                {/* Fixed Horizontal Row Design */}
                <div className="flex flex-row flex-wrap gap-3 pb-2">
                  {availableMajors.map(major => (
                    <button key={major} onClick={() => handleMajorToggle(major)} disabled={isRecalculating}
                      className={`whitespace-nowrap px-6 py-3.5 rounded-xl font-black text-sm transition-all duration-300 border-2 flex-grow sm:flex-grow-0
                        ${selectedMajor === major 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30 scale-[1.02]' 
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'}`}>
                      {major}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* The Top Match */}
            <div className="bg-white rounded-[2rem] shadow-xl p-8 sm:p-10 border-t-[8px] border-blue-600">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">#1 Statistical Career Match</p>
              <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 leading-tight">{roadmapData?.top_role?.title}</h3>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-1.5 rounded-lg font-black text-sm mb-6">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                {roadmapData?.top_role?.match_percentage}% Vector Match
              </div>
              <p className="text-lg font-medium text-slate-600 leading-relaxed mb-6">{roadmapData?.top_role?.description}</p>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm font-medium text-slate-700">
                <span className="font-black text-slate-900 block mb-1">Why this fits you:</span>
                {roadmapData?.top_role?.personality_notes}
              </div>
            </div>

            {/* Top 5 Alternatives Matrix */}
            <div className="bg-slate-900 rounded-[2rem] shadow-xl p-8 sm:p-10 text-white">
              <h3 className="text-xl font-black uppercase tracking-wider mb-6 flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Alternate Viable Pathways
              </h3>
              <div className="grid gap-4">
                {roadmapData?.top_5_roles?.map((role, idx) => (
                  <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-center hover:bg-slate-700 transition-colors">
                    <span className="font-bold text-slate-200">{idx + 1}. {role.title}</span>
                    <span className="font-black text-blue-400">{role.percentage}% Match</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Semester Breakdown (Stacked Lists) */}
            <div className="bg-white rounded-[2rem] shadow-xl p-8 sm:p-10">
              <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight border-b-2 border-slate-100 pb-4">Curriculum Breakdown</h2>
              <div className="space-y-10">
                {['year_1', 'year_2', 'year_3'].map((year, i) => (
                  <div key={year} className="relative border-l-[6px] border-blue-100 pl-6 pb-2">
                    <div className="absolute w-4 h-4 bg-blue-600 rounded-full left-[-11px] top-1 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    <h3 className="font-black text-xl text-slate-900 mb-3 uppercase tracking-wider">Year {i+1}</h3>
                    
                    {/* Display Major context if applicable for year 2 and 3 AND the program has majors */}
                    {availableMajors && roadmapData?.roadmap?.[year]?.mandatory_major && roadmapData.roadmap[year].mandatory_major !== 'None' && (
                      <div className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest mb-5">
                        Focus Area: {roadmapData.roadmap[year].mandatory_major}
                      </div>
                    )}
                    {availableMajors && roadmapData?.roadmap?.[year]?.continued_major && roadmapData.roadmap[year].continued_major !== 'None' && (
                      <div className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-md text-xs font-black uppercase tracking-widest mb-5">
                        Major Continued: {roadmapData.roadmap[year].continued_major}
                      </div>
                    )}

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                        <span className="font-black text-blue-600 text-xs uppercase tracking-widest block mb-2 border-b border-slate-200 pb-2">Semester 1</span>
                        {renderModulesList(roadmapData?.roadmap?.[year]?.semester_1)}
                      </div>
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                        <span className="font-black text-blue-600 text-xs uppercase tracking-widest block mb-2 border-b border-slate-200 pb-2">Semester 2</span>
                        {renderModulesList(roadmapData?.roadmap?.[year]?.semester_2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DREAM PIVOT */}
        {activeTab === "pivot" && (
          <div className="bg-white rounded-[2rem] shadow-xl p-8 sm:p-10 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Dream Job Pivot</h2>
            <p className="text-slate-500 font-medium mb-8">Enter a career that wasn't in your roadmap. The AI will calculate the feasibility of bridging the gap using your <span className="font-bold text-indigo-600">{selectedMajor ? `${selectedMajor} background` : 'current degree'}</span>.</p>
            
            <form onSubmit={handlePivot} className="flex flex-col sm:flex-row gap-4 mb-10">
              <input type="text" required value={dreamJobInput} onChange={e=>setDreamJobInput(e.target.value)} placeholder="e.g. Cybersecurity Architect" className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 outline-none rounded-xl px-5 py-4 font-bold text-slate-900 transition-colors" />
              <button type="submit" disabled={isActionLoading} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-black tracking-wide transition-all shadow-lg active:scale-95">
                {isActionLoading ? "ANALYZING..." : "RUN ANALYSIS"}
              </button>
            </form>

            {pivotData && (
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 animate-in slide-in-from-bottom-5">
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200">
                  <h3 className="text-xl font-black text-slate-900 uppercase">Pivot Diagnostics</h3>
                  <div className="bg-blue-600 text-white px-5 py-2 rounded-xl font-black text-lg shadow-md">{pivotData.feasibility_score}% Feasible</div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">The Gap Analysis</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">{pivotData.gap_analysis}</p>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">The Richfield Bridge</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">{pivotData.richfield_bridge}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: POSTGRAD ROI */}
        {activeTab === "postgrad" && (
          <div className="bg-white rounded-[2rem] shadow-xl p-8 sm:p-10 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black text-slate-900 mb-3">Postgrad ROI</h2>
            <p className="text-slate-500 font-medium mb-8">Select a postgraduate path to calculate your career acceleration based on your <span className="font-bold text-indigo-600">{selectedMajor ? `${selectedMajor} background` : 'current degree'}</span>.</p>
            
            <form onSubmit={handlePostgrad} className="flex flex-col sm:flex-row gap-4 mb-10">
              <select required value={postgradSelect} onChange={e=>setPostgradSelect(e.target.value)} className="flex-1 bg-slate-50 border-2 border-slate-200 focus:border-blue-500 outline-none rounded-xl px-5 py-4 font-bold text-slate-900 transition-colors appearance-none cursor-pointer">
                <option value="" disabled>Select Honours/Postgrad path...</option>
                <option value="BSc Honours in Information Technology">BSc Honours in Information Technology</option>
                <option value="Bachelor of Commerce Honours in Business Management">Bachelor of Commerce Honours in Business Management</option>
                <option value="Bachelor of Public Management Honours">Bachelor of Public Management Honours</option>
                <option value="Postgraduate Diploma in Management">Postgraduate Diploma in Management</option>
                <option value="Master of Business Administration (MBA)">Master of Business Administration (MBA)</option>
                <option value="Master of Public Management (MPM)">Master of Public Management (MPM)</option>
              </select>
              <button type="submit" disabled={isActionLoading} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-black tracking-wide transition-all shadow-lg active:scale-95">
                {isActionLoading ? "CALCULATING..." : "CALCULATE ROI"}
              </button>
            </form>

            {postgradData && (
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 animate-in slide-in-from-bottom-5">
                <div className="mb-8 pb-6 border-b border-slate-200 text-center">
                  <h4 className="font-black text-slate-400 uppercase text-xs tracking-widest mb-3">Projected Career Multiplier</h4>
                  <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{postgradData.career_multiplier}</div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest mb-2">New Focus Areas</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">{postgradData.focus_areas}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-indigo-800 font-medium italic text-sm text-center">"{postgradData.comparison_note}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- CHATBOT WIDGET --- */}
      <div className="fixed bottom-6 right-6 sm:bottom-10 sm:right-10 z-50 flex flex-col items-end pointer-events-none">
        {isChatOpen && (
          <div className="w-[calc(100vw-3rem)] sm:w-[400px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 mb-4 pointer-events-auto flex flex-col h-[600px] max-h-[70vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-black text-xs shadow-inner">AI</div>
                <div>
                  <h3 className="font-black text-sm tracking-widest uppercase leading-none">Richfield Advisor</h3>
                  <p className="text-[10px] text-green-400 font-bold uppercase mt-1 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Online</p>
                </div>
              </div>
              <button onClick={()=>setIsChatOpen(false)} className="text-slate-400 hover:text-white transition-colors p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 flex flex-col">
              {chatMessages.map((m,i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-sm font-medium leading-relaxed shadow-sm ${m.role === 'assistant' ? 'bg-white border border-slate-200 text-slate-800 self-start rounded-tl-sm' : 'bg-blue-600 text-white self-end text-left rounded-tr-sm'}`}>
                  <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />, strong: ({node, ...props}) => <strong className="font-black" {...props} />, ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 mb-2" {...props} /> }}>{m.content}</ReactMarkdown>
                </div>
              ))}
              {isChatLoading && <div className="bg-white border border-slate-200 text-blue-600 self-start p-4 rounded-2xl rounded-tl-sm shadow-sm flex gap-1"><span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-75"></span><span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce delay-150"></span></div>}
              <div ref={chatEndRef} />
            </div>
            
            <form onSubmit={handleChat} className="p-4 bg-white border-t border-slate-100 flex gap-3 z-10">
              <input type="text" value={chatInput} onChange={e=>setChatInput(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-600 focus:bg-white outline-none font-medium text-slate-900 transition-all placeholder:text-slate-400" placeholder="Ask about modules or careers..." />
              <button type="submit" disabled={isChatLoading} className="bg-slate-900 text-white px-5 rounded-xl font-black text-sm hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-md active:scale-95 flex items-center justify-center"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg></button>
            </form>
          </div>
        )}

        {!isChatOpen && (
          <button onClick={()=>setIsChatOpen(true)} className="group relative flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full shadow-[0_10px_25px_rgba(37,99,235,0.4)] pointer-events-auto hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white"><svg className="w-7 h-7 transform group-hover:-rotate-12 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg><span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black animate-pulse">1</span></button>
        )}
      </div>

      {/* Global styling for Retake & Sign Out buttons */}
      <div className="w-full max-w-3xl mx-auto flex justify-center gap-4 mt-8">
          <button onClick={handleRetake} className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-all text-sm uppercase tracking-widest">Retake Assessment</button>
          <button onClick={handleSignOut} className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl transition-all text-sm uppercase tracking-widest">Sign Out</button>
      </div>

    </div>
  );
}