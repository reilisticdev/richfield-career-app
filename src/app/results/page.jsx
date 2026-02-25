"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '../../lib/supabase'; 
import ReactMarkdown from 'react-markdown'; 

export default function ResultsScreen() {
  const router = useRouter();
  const chatEndRef = useRef(null);
  
  const [userData, setUserData] = useState(null);
  const [userVector, setUserVector] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap"); 
  const [roadmapData, setRoadmapData] = useState(null);
  const [pivotData, setPivotData] = useState(null);
  const [postgradData, setPostgradData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [dreamJobInput, setDreamJobInput] = useState("");
  const [postgradSelect, setPostgradSelect] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your Richfield AI Advisor. Ask me anything about your modules, our industry badges (like AWS or IBM), or 2026 job trends!" }
  ]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // --- SCENARIO 1: THE RETURNING STUDENT (Magic Link) ---
        // Check if Supabase has an active, secure session
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // They are logged in! Fetch their saved data directly from your database
          const { data: dbData, error: dbError } = await supabase
            .from('student_leads')
            .select('*')
            .eq('email', session.user.email)
            .single();

          if (dbData && !dbError) {
            setUserData({
              firstName: dbData.first_name,
              lastName: dbData.last_name,
              program: dbData.current_program,
            });
            setUserVector(dbData.psych_scores);
            setRoadmapData(dbData.roadmap_result);
            setIsLoading(false);
            return; // Stop here! We have everything we need.
          }
        }

        // --- SCENARIO 2: THE NEW STUDENT (Just finished quiz) ---
        const storedUser = localStorage.getItem("richfieldUser");
        const storedVector = localStorage.getItem("userVector");

        if (!storedUser || !storedVector) {
          router.push("/"); return;
        }

        const parsedUser = JSON.parse(storedUser);
        const parsedVector = JSON.parse(storedVector);
        setUserData(parsedUser);
        setUserVector(parsedVector);

        // Fetch fresh roadmap from Gemini API
        const response = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores: parsedVector, program: parsedUser.program }),
        });
        const aiData = await response.json();
        setRoadmapData(aiData);

        // Save new results to Supabase
        const dbId = localStorage.getItem('student_db_id');
        if (dbId) {
          await supabase
            .from('student_leads')
            .update({
              psych_scores: parsedVector, 
              roadmap_result: aiData        
            })
            .eq('id', dbId); 
        }

      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isChatOpen]);

  // --- API Handlers ---
  const handlePivotSubmit = async (e) => {
    e.preventDefault();
    if (!dreamJobInput) return;
    setIsActionLoading(true);
    try {
      const response = await fetch("/api/pivot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: userVector, program: userData.program, dream_job: dreamJobInput }),
      });
      const data = await response.json();
      setPivotData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePostgradSubmit = async (e) => {
    e.preventDefault();
    if (!postgradSelect) return;
    setIsActionLoading(true);
    try {
      const response = await fetch("/api/postgrad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ program: userData.program, postgrad_choice: postgradSelect }),
      });
      const data = await response.json();
      setPostgradData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, program: userData.program, scores: userVector }),
      });
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleRetake = async () => {
    await supabase.auth.signOut(); // Securely log them out
    localStorage.removeItem("userVector");
    localStorage.clear(); 
    router.push("/");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-6 text-center">
        <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin mb-8 shadow-2xl"></div>
        <h2 className="text-white text-2xl font-black mb-2">Accessing Dashboard</h2>
        <p className="text-gray-300 font-bold text-lg">Retrieving your 2026 Richfield Roadmap...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans flex flex-col items-center pb-32 relative selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-2xl">
        
        {/* HEADER */}
        <div className="text-center mb-10 mt-6 bg-white p-6 rounded-3xl shadow-md border-2 border-gray-200">
          <h1 className="text-4xl font-black text-gray-900 mb-3 uppercase tracking-tight">
            Your Roadmap,<br/><span className="text-blue-700">{userData?.firstName}</span>
          </h1>
          <div className="inline-block bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm tracking-wide">
            {userData?.program}
          </div>
        </div>

        {/* TABS */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mb-10">
          {["roadmap", "pivot", "postgrad"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 min-h-[54px] px-4 text-base font-black rounded-2xl transition-all border-2 ${activeTab === tab ? "bg-blue-700 text-white border-blue-800 shadow-xl scale-[1.02]" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-50 hover:border-gray-400"}`}>
              {tab === "roadmap" ? "CORE ROADMAP" : tab === "pivot" ? "DREAM JOB PIVOT" : "POSTGRAD ROI"}
            </button>
          ))}
        </div>

        {/* TAB 1: ROADMAP */}
        {activeTab === "roadmap" && (
          <div className="space-y-8 flex-col animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-t-[10px] border-blue-700">
              <h2 className="text-sm font-black text-blue-800 tracking-widest uppercase mb-3">#1 Statistical Career Match</h2>
              <h3 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{roadmapData?.top_role?.title}</h3>
              <div className="inline-block bg-green-200 text-green-900 px-4 py-2 rounded-xl font-black text-lg mb-6 border-2 border-green-400 shadow-sm">
                {roadmapData?.top_role?.match_percentage}% Vector Match
              </div>
              <p className="text-gray-800 font-bold text-lg mb-6 leading-relaxed">{roadmapData?.top_role?.description}</p>
              <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200 text-blue-900 font-semibold text-base shadow-inner">
                <span className="font-black uppercase tracking-wide block mb-2 text-blue-800">Why this fits you:</span> {roadmapData?.top_role?.personality_notes}
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-gray-200">
              <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase border-b-2 border-gray-100 pb-4">Semester Breakdown</h2>
              
              <div className="space-y-8">
                <div className="border-l-[6px] border-blue-400 pl-5">
                  <h3 className="font-black text-xl text-gray-900 mb-3">YEAR 1: FOUNDATION</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                    <div className="bg-gray-100 p-4 rounded-2xl border-2 border-gray-200"><span className="font-black text-blue-700 block mb-2 uppercase tracking-wide">Semester 1</span><span className="font-bold text-gray-800">{roadmapData?.roadmap?.year_1?.semester_1}</span></div>
                    <div className="bg-gray-100 p-4 rounded-2xl border-2 border-gray-200"><span className="font-black text-blue-700 block mb-2 uppercase tracking-wide">Semester 2</span><span className="font-bold text-gray-800">{roadmapData?.roadmap?.year_1?.semester_2}</span></div>
                  </div>
                </div>

                <div className="border-l-[6px] border-indigo-500 pl-5">
                  <h3 className="font-black text-xl text-gray-900 mb-3">YEAR 2: SPECIALIZATION</h3>
                  <div className="bg-indigo-700 text-white p-3 rounded-xl text-sm font-black uppercase tracking-wider mb-4 inline-block shadow-md">
                    Mandatory Major: {roadmapData?.roadmap?.year_2?.mandatory_major}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                    <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-200"><span className="font-black text-indigo-800 block mb-2 uppercase tracking-wide">Semester 1</span><span className="font-bold text-indigo-950">{roadmapData?.roadmap?.year_2?.semester_1}</span></div>
                    <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-200"><span className="font-black text-indigo-800 block mb-2 uppercase tracking-wide">Semester 2</span><span className="font-bold text-indigo-950">{roadmapData?.roadmap?.year_2?.semester_2}</span></div>
                  </div>
                </div>

                <div className="border-l-[6px] border-purple-500 pl-5">
                  <h3 className="font-black text-xl text-gray-900 mb-3">YEAR 3: EXECUTION</h3>
                  <p className="text-base text-purple-900 font-black mb-4 bg-purple-100 p-3 rounded-xl inline-block border-2 border-purple-200">Major Continued: {roadmapData?.roadmap?.year_3?.continued_major}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-base">
                    <div className="bg-gray-100 p-4 rounded-2xl border-2 border-gray-200"><span className="font-black text-purple-700 block mb-2 uppercase tracking-wide">Semester 1</span><span className="font-bold text-gray-800">{roadmapData?.roadmap?.year_3?.semester_1}</span></div>
                    <div className="bg-gray-100 p-4 rounded-2xl border-2 border-gray-200"><span className="font-black text-purple-700 block mb-2 uppercase tracking-wide">Semester 2</span><span className="font-bold text-gray-800">{roadmapData?.roadmap?.year_3?.semester_2}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-gray-800">
              <h2 className="text-xl font-black text-white mb-6 uppercase tracking-wider">Top 5 Alternative Roles</h2>
              <div className="space-y-4">
                {roadmapData?.top_5_roles?.map((role, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-800 rounded-2xl border-2 border-gray-700">
                    <span className="font-bold text-white text-lg">{idx + 1}. {role.title}</span>
                    <span className="font-black text-blue-400 text-xl">{role.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PIVOT */}
        {activeTab === "pivot" && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-gray-200">
              <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase">Run Diagnostics</h2>
              <p className="text-gray-700 text-lg font-bold mb-8">Type in your exact dream job to see the real gap between your psych vector, your degree, and reality.</p>
              
              <form onSubmit={handlePivotSubmit} className="flex flex-col sm:flex-row gap-4 mb-10">
                <input type="text" placeholder="e.g. Cybersecurity Manager" required value={dreamJobInput} onChange={(e) => setDreamJobInput(e.target.value)}
                  className="flex-1 px-5 py-4 min-h-[60px] bg-gray-50 border-2 border-gray-300 rounded-2xl text-lg font-black text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition-all shadow-inner" />
                <button type="submit" disabled={isActionLoading} className="min-h-[60px] bg-blue-700 text-white px-8 rounded-2xl font-black text-lg hover:bg-blue-800 active:scale-95 disabled:opacity-50 transition-all shadow-lg">
                  {isActionLoading ? "ANALYZING..." : "ANALYZE ROLE"}
                </button>
              </form>

              {pivotData && (
                <div className="space-y-6 bg-gray-50 p-6 sm:p-8 rounded-3xl border-2 border-gray-200 shadow-inner">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b-4 border-gray-200 pb-6 mb-6 gap-4">
                    <h3 className="text-2xl font-black text-gray-900 uppercase">Feasibility Score</h3>
                    <span className={`text-4xl font-black px-6 py-2 rounded-2xl border-4 ${pivotData.feasibility_score > 75 ? 'text-green-700 border-green-500 bg-green-100' : 'text-orange-700 border-orange-500 bg-orange-100'}`}>
                      {pivotData.feasibility_score}%
                    </span>
                  </div>
                  <div><h4 className="font-black text-xl text-gray-900 mb-2 uppercase">Gap Analysis</h4><p className="text-base text-gray-800 font-semibold leading-relaxed">{pivotData.gap_analysis}</p></div>
                  <div><h4 className="font-black text-xl text-gray-900 mb-2 uppercase">The Richfield Bridge</h4><p className="text-base text-gray-800 font-semibold leading-relaxed">{pivotData.richfield_bridge}</p></div>
                  <div><h4 className="font-black text-xl text-gray-900 mb-2 uppercase">2026 Market Reality</h4><p className="text-base text-gray-800 font-semibold leading-relaxed">{pivotData.market_reality}</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: POSTGRAD */}
        {activeTab === "postgrad" && (
          <div className="animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 border-2 border-gray-200">
              <h2 className="text-3xl font-black text-gray-900 mb-4 uppercase">Postgraduate ROI</h2>
              <p className="text-gray-700 text-lg font-bold mb-8">Select a Richfield postgraduate path to see how it multiplies your career trajectory and salary potential.</p>
              
              <form onSubmit={handlePostgradSubmit} className="flex flex-col gap-6 mb-10">
                <select required value={postgradSelect} onChange={(e) => setPostgradSelect(e.target.value)}
                  className="w-full px-5 py-4 min-h-[60px] bg-gray-50 border-2 border-gray-300 rounded-2xl text-lg font-black text-gray-900 outline-none focus:border-purple-600 focus:bg-white shadow-inner appearance-none cursor-pointer">
                  <option value="" disabled>Select Postgrad Program...</option>
                  <option value="BSc Honours in Information Technology">BSc Honours in Information Technology</option>
                  <option value="BCom Honours in Business Management">BCom Honours in Business Management</option>
                  <option value="Postgraduate Diploma in Management">Postgraduate Diploma in Management</option>
                  <option value="Master of Business Administration (MBA)">Master of Business Administration (MBA)</option>
                </select>
                <button type="submit" disabled={isActionLoading} className="min-h-[60px] w-full bg-purple-700 text-white px-8 rounded-2xl font-black text-lg hover:bg-purple-800 active:scale-95 disabled:opacity-50 transition-all shadow-lg uppercase tracking-wide">
                  {isActionLoading ? "CALCULATING ROI..." : "GENERATE DIAGNOSTIC"}
                </button>
              </form>

              {postgradData && (
                <div className="space-y-6 bg-purple-50 p-6 sm:p-8 rounded-3xl border-4 border-purple-200 shadow-inner">
                  <div><h4 className="font-black text-xl text-purple-900 mb-2 uppercase">The Career Multiplier</h4><p className="text-base text-purple-950 font-bold leading-relaxed">{postgradData.career_multiplier}</p></div>
                  <div><h4 className="font-black text-xl text-purple-900 mb-2 uppercase">Key Focus Areas</h4><p className="text-base text-purple-950 font-bold leading-relaxed">{postgradData.focus_areas}</p></div>
                  <div className="mt-6 pt-6 border-t-4 border-purple-200"><h4 className="font-black text-xl text-purple-900 mb-2 uppercase">Undergrad vs Postgrad</h4><p className="text-lg text-purple-950 font-black italic">"{postgradData.comparison_note}"</p></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Security & System Actions */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button onClick={handleRetake} className="px-6 py-3 bg-gray-200 text-gray-800 font-black rounded-xl border-2 border-gray-300 hover:bg-gray-300 active:scale-95 transition-all uppercase tracking-widest text-xs shadow-sm">
            Retake Assessment
          </button>
          <button onClick={handleSignOut} className="px-6 py-3 bg-red-100 text-red-700 font-black rounded-xl border-2 border-red-200 hover:bg-red-200 active:scale-95 transition-all uppercase tracking-widest text-xs shadow-sm">
            Sign Out
          </button>
        </div>
        <p className="text-gray-500 font-bold text-xs text-center mt-6">Diagnostics powered by Richfield 2026 Academic Prospectus.</p>

      </div>

      {/* --- FLOATING CHATBOT UI --- */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-50 flex flex-col items-end pointer-events-none">
        {isChatOpen && (
          <div className="bg-white w-[calc(100vw-2rem)] sm:w-[400px] h-[65vh] max-h-[35rem] mb-4 rounded-3xl shadow-2xl border-4 border-gray-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 pointer-events-auto">
            <div className="bg-blue-700 p-5 text-white flex justify-between items-center shadow-md z-10">
              <span className="font-black text-lg tracking-wide flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                AI ADVISOR
              </span>
              <button onClick={() => setIsChatOpen(false)} className="text-blue-200 hover:text-white font-black text-3xl leading-none">&times;</button>
            </div>
            
            <div className="flex-1 p-5 overflow-y-auto bg-gray-50 flex flex-col gap-4">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`p-4 rounded-2xl max-w-[90%] text-base shadow-sm ${msg.role === 'assistant' ? 'bg-white border-2 border-gray-200 text-gray-900 self-start rounded-tl-sm' : 'bg-blue-700 text-white self-end rounded-tr-sm font-semibold'}`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown 
                      components={{
                        p: ({node, ...props}) => <p className="mb-3 last:mb-0 font-medium leading-relaxed" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-black text-blue-900" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-black mt-4 mb-2 text-blue-800 uppercase tracking-wide border-b border-gray-200 pb-1" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 font-medium" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 font-medium" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1 leading-relaxed" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {isChatLoading && (
                <div className="bg-white border-2 border-gray-200 text-blue-700 self-start p-4 rounded-2xl rounded-tl-sm text-2xl font-black flex gap-1 shadow-sm">
                  <span className="animate-bounce">.</span><span className="animate-bounce delay-100">.</span><span className="animate-bounce delay-200">.</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t-4 border-gray-100 flex gap-3 z-10">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your question..."
                className="flex-1 px-4 py-3 min-h-[50px] bg-gray-100 border-2 border-gray-200 rounded-xl text-base font-bold text-gray-900 outline-none focus:border-blue-600 focus:bg-white transition-all" />
              <button type="submit" disabled={isChatLoading} className="min-h-[50px] bg-blue-700 text-white px-5 rounded-xl font-black text-base hover:bg-blue-800 active:scale-95 disabled:opacity-50 transition-all shadow-md">
                SEND
              </button>
            </form>
          </div>
        )}

        <button onClick={() => setIsChatOpen(!isChatOpen)} className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-700 rounded-full shadow-2xl border-4 border-white flex items-center justify-center text-white hover:bg-blue-800 hover:scale-105 active:scale-95 transition-all pointer-events-auto">
          <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      </div>

    </div>
  );
}