"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '../lib/supabase';

export default function IntakeScreen() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    program: "",
    studyPreference: "Contact",
    postgradInterest: "No",
  });

  const programs = [
    "Bachelor of Science in Information Technology",
    "Diploma in Information Technology",
    "Higher Certificate in Information Technology",
    "Higher Certificate in Computer Forensics",
    "Bachelor of Commerce (BCom)",
    "BCom for SAICA Pathways",
    "Bachelor of Business Administration (BBA)",
    "Bachelor of Public Management",
    "Diploma in Business Administration",
    "Diploma in Local Government Management",
    "Higher Certificate in Business Administration",
    "Higher Certificate in Office Administration",
    "Higher Certificate in Local Government Management"
  ];

  const handleStart = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // 🛑 The Student Email Validator
    const emailDomain = formData.email.toLowerCase();
    if (!emailDomain.endsWith('@my.richfield.ac.za') && !emailDomain.endsWith('@richfield.ac.za')) {
      alert("Access Denied: Please use your official Richfield student email (e.g., 123456789@my.richfield.ac.za) to continue.");
      setIsSubmitting(false);
      return; // Stops the function from hitting the database
    }

    try {
      // Send the data to your Supabase table
      const { data, error } = await supabase
        .from('student_leads')
        .insert([
          {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            current_program: formData.program,
            study_preference: formData.studyPreference,
            postgrad_intent: formData.postgradInterest
          }
        ])
        .select();

      if (error) {
        console.error("Database Error:", error);
        alert("Database error: Could not save your details. You might have already registered with this email.");
        setIsSubmitting(false);
        return; 
      }

      // Save their unique Database ID to the browser for the quiz results
      if (data && data.length > 0) {
        localStorage.setItem('student_db_id', data[0].id);
      }

      localStorage.setItem("richfieldUser", JSON.stringify(formData));
      router.push("/quiz");

    } catch (err) {
      console.error("Unexpected Error:", err);
      alert("An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-10 font-sans sm:px-12 flex flex-col justify-center">
      
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
          Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Richfield</span><br/>Roadmap
        </h1>
        <p className="text-lg font-medium text-gray-500">
          Let's map out your exact career trajectory.
        </p>
      </div>

      <form onSubmit={handleStart} className="space-y-6 w-full max-w-md mx-auto">
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">First Name</label>
            <input required type="text" 
              className="w-full px-5 py-4 text-lg bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900 font-semibold" 
              value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} 
              placeholder="e.g. Sipho" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Last Name</label>
            <input required type="text" 
              className="w-full px-5 py-4 text-lg bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900 font-semibold"
              value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} 
              placeholder="e.g. Ndlovu" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Student Email</label>
          <input required type="email" 
            className="w-full px-5 py-4 text-lg bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900 font-semibold"
            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
            placeholder="e.g. 123456789@my.richfield.ac.za" />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Program</label>
          <select required 
            className="w-full px-5 py-4 text-base bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-gray-900 font-bold appearance-none"
            value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})}>
            <option value="" disabled>Select your 2026 program...</option>
            {programs.map(prog => (
              <option key={prog} value={prog}>{prog}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Study Preference</label>
            <div className="flex p-1 bg-gray-100 rounded-2xl">
              <button type="button" 
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formData.studyPreference === "Contact" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                onClick={() => setFormData({...formData, studyPreference: "Contact"})}>
                On Campus
              </button>
              <button type="button" 
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formData.studyPreference === "Distance" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                onClick={() => setFormData({...formData, studyPreference: "Distance"})}>
                Distance
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Plan to do Postgrad?</label>
            <div className="flex p-1 bg-gray-100 rounded-2xl">
              <button type="button" 
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formData.postgradInterest === "Yes" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                onClick={() => setFormData({...formData, postgradInterest: "Yes"})}>
                Yes, definitely
              </button>
              <button type="button" 
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${formData.postgradInterest === "No" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500"}`}
                onClick={() => setFormData({...formData, postgradInterest: "No"})}>
                No / Not sure
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6">
          <button type="submit" disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xl py-5 rounded-2xl shadow-[0_10px_25px_rgba(79,70,229,0.3)] hover:shadow-[0_15px_30px_rgba(79,70,229,0.4)] active:scale-[0.98] transition-all duration-200 flex justify-center items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}>
            {isSubmitting ? "VERIFYING..." : "START ASSESSMENT"}
            {!isSubmitting && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
        
      </form>
    </div>
  );
}