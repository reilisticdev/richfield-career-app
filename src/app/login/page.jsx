"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function StudentPortalLogin() {
  const router = useRouter();
  
  const [currentView, setCurrentView] = useState("selection"); 
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); 
  const [errorMessage, setErrorMessage] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const emailDomain = email.toLowerCase();
    if (!emailDomain.endsWith('@my.richfield.ac.za') && !emailDomain.endsWith('@richfield.ac.za')) {
      setStatus("error");
      setErrorMessage("Access Restricted: Please use a valid Richfield student email.");
      return;
    }

    try {
      const { data: existingStudent, error: dbError } = await supabase
        .from('student_leads')
        .select('id')
        .eq('email', email)
        .single();

      if (dbError || !existingStudent) {
        setStatus("error");
        setErrorMessage("We couldn't find a roadmap for this email. Please take the assessment first!");
        return;
      }

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/results`,
        },
      });

      if (authError) throw authError;
      
      setStatus("success");
    } catch (error) {
      console.error("Auth Error:", error.message);
      setStatus("error");
      
      // NEW: Catch the specific rate limit error!
      if (error.message.includes("rate limit")) {
        setErrorMessage("Too many requests. Please wait an hour before requesting another link, or try a different email.");
      } else {
        setErrorMessage("Failed to send the secure link. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-30 animate-pulse delay-700"></div>

      {/* Main Glassmorphic Portal Card */}
      <div className="w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/50 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative z-10 transition-all duration-500">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl shadow-lg shadow-blue-500/30 mb-6">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Richfield OS</h1>
          <p className="text-base font-semibold text-slate-500">The central hub for your career trajectory.</p>
        </div>

        {/* --- VIEW 1: PATH SELECTION --- */}
        {currentView === "selection" && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => router.push('/')}
              className="w-full group text-left p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 flex items-center justify-between"
            >
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">New Student</h3>
                <p className="text-sm font-bold text-slate-500">Take the AI assessment and build your roadmap.</p>
              </div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
            </button>

            <button 
              onClick={() => setCurrentView("login")}
              className="w-full group text-left p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl hover:bg-slate-100 transition-all duration-300 flex items-center justify-between"
            >
              <div>
                <h3 className="text-xl font-black text-slate-900 mb-1">Returning Student</h3>
                <p className="text-sm font-bold text-slate-500">Access your saved dashboard and AI Chat.</p>
              </div>
              <div className="w-10 h-10 bg-white text-slate-400 rounded-full flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              </div>
            </button>
          </div>
        )}

        {/* --- VIEW 2: SECURE LOGIN --- */}
        {currentView === "login" && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-300">
            {status === "success" ? (
              <div className="bg-green-50 border-2 border-green-200 p-8 rounded-3xl text-center shadow-inner">
                <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/40">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="font-black text-green-900 text-2xl mb-2">Secure Link Sent</h3>
                <p className="text-base text-green-800 font-semibold">Check your Richfield email inbox. Click the magic link to instantly access your dashboard.</p>
              </div>
            ) : (
              <form onSubmit={handleAuth} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Richfield Email</label>
                  <input 
                    required 
                    type="email" 
                    disabled={status === "loading"}
                    className="w-full px-6 py-5 text-lg bg-white border-2 border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all text-slate-900 font-bold placeholder-slate-300 disabled:opacity-50"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="e.g. 123456789@my.richfield.ac.za" 
                  />
                </div>

                {status === "error" && (
                  <div className="text-sm font-bold text-red-700 bg-red-50 p-4 rounded-2xl border-2 border-red-100 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={status === "loading"}
                  className="w-full bg-slate-900 text-white font-black text-lg py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 active:shadow-md transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:hover:translate-y-0 tracking-wide uppercase"
                >
                  {status === "loading" ? (
                    <>
                      <div className="w-5 h-5 border-4 border-slate-500 border-t-white rounded-full animate-spin"></div>
                      VERIFYING...
                    </>
                  ) : (
                    "SEND ACCESS LINK"
                  )}
                </button>
                
                <button 
                  type="button"
                  onClick={() => {setCurrentView("selection"); setStatus("idle"); setErrorMessage("");}}
                  className="w-full text-center text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors pt-2"
                >
                  ← Back to selection
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}