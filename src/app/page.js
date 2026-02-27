"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '../lib/supabase';

// Comprehensive Richfield Undergrad Programmes
const richfieldPrograms = [
  "Bachelor of Science in Information Technology",
  "Diploma in Information Technology",
  "Higher Certificate in Information Technology",
  "Higher Certificate in Computer Forensics",
  "Bachelor of Commerce (BCom) - Route 1 (AGA)",
  "Bachelor of Commerce (BCom) - Route 2 (PGDA)",
  "Bachelor of Business Administration (BBA)",
  "Bachelor of Public Management",
  "Diploma in Business Administration",
  "Diploma in Local Government Management",
  "Higher Certificate in Business Administration",
  "Higher Certificate in Office Administration",
  "Higher Certificate in Local Government Management"
];

export default function RichfieldLandingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    program: "",
    campus: "Richfield",
    userCategory: "university" 
  });

  const handleStart = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const emailLower = formData.email.toLowerCase();
    if (!emailLower.endsWith('@my.richfield.ac.za') && !emailLower.endsWith('@richfield.ac.za')) {
      alert("Access Denied: Please use your official Richfield student email (e.g., 123456789@my.richfield.ac.za) to generate a roadmap.");
      setIsSubmitting(false);
      return; 
    }

    try {
      const { data: existingUser } = await supabase.from('student_leads').select('id').eq('email', formData.email).maybeSingle(); 

      if (existingUser) {
        alert("A roadmap already exists for this student! Redirecting to the secure login.");
        setIsSubmitting(false);
        router.push("/login");
        return; 
      }

      const { data, error } = await supabase.from('student_leads').insert([{
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            current_program: formData.program,
            institution_name: formData.campus,
            user_category: formData.userCategory
        }]).select();

      if (error) throw error;
      if (data && data.length > 0) {
        localStorage.setItem('student_db_id', data[0].id);
      }

      localStorage.setItem("richfieldUser", JSON.stringify(formData));
      router.push("/quiz");

    } catch (err) {
      alert("An error occurred saving your profile. Please check your internet connection.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-600 selection:text-white relative overflow-hidden flex flex-col items-center justify-center p-4 sm:p-8">
      
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-400/30 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full mix-blend-multiply filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-cyan-400/20 rounded-full mix-blend-multiply filter blur-[80px] pointer-events-none"></div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        <div className="text-center lg:text-left pt-10 lg:pt-0">
          <div className="inline-flex items-center justify-center px-4 py-2 bg-blue-100/80 text-blue-700 font-black text-xs rounded-full uppercase tracking-widest mb-6 border border-blue-200/50 backdrop-blur-sm shadow-sm">
            Richfield Career Architect ⚡️
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.05] mb-6">
            Map your <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              academic future.
            </span>
          </h1>
          <p className="text-lg sm:text-xl font-medium text-slate-600 max-w-xl mx-auto lg:mx-0 mb-8 leading-relaxed">
            Stop guessing your modules. Take the 2-minute AI assessment and generate a hyper-personalized, semester-by-semester roadmap mapped strictly to the Richfield 2026 syllabus.
          </p>
          
          <div className="hidden lg:flex items-center gap-4 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-600 rounded-full"></div> Smart Module Mapping</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-indigo-600 rounded-full"></div> Career Diagnostics</div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <form onSubmit={handleStart} className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 border border-white rounded-[2.5rem] shadow-2xl relative">
            
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full filter blur-2xl opacity-40 pointer-events-none"></div>

            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Student Portal Setup</h2>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                  <input required type="text" 
                    className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" 
                    value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder="Sipho" />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                  <input required type="text" 
                    className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all" 
                    value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder="Ndlovu" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Richfield Email</label>
                <input required type="email" 
                  className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:font-medium placeholder:text-slate-400" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="e.g. 123456789@my.richfield.ac.za" />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">2026 Degree / Program</label>
                <select required 
                  className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                  value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})}>
                  <option value="" disabled>Select your enrolled program...</option>
                  {richfieldPrograms.map((prog) => (
                    <option key={prog} value={prog}>{prog}</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={isSubmitting}
                className={`w-full mt-8 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-blue-600/20 hover:-translate-y-1 active:translate-y-0 transition-all flex justify-center items-center gap-2 border border-blue-500
                  ${isSubmitting ? 'bg-slate-400 border-slate-400 opacity-80 pointer-events-none' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}>
                {isSubmitting ? "AUTHENTICATING..." : "START DIAGNOSTIC"}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button onClick={() => router.push('/login')} className="text-sm font-black text-slate-500 hover:text-blue-600 transition-colors uppercase tracking-widest flex items-center justify-center gap-2 mx-auto">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              Student Login Portal
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}