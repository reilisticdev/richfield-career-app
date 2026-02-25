"use client";

import { useState } from "react";
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isError, setIsError] = useState(false);

  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);
    setIsError(false);

    // Enforce Richfield emails only
    const emailDomain = email.toLowerCase();
    if (!emailDomain.endsWith('@my.richfield.ac.za') && !emailDomain.endsWith('@richfield.ac.za')) {
      setStatusMessage("Access Denied: Please use your official Richfield student email.");
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Tell Supabase to send the Magic Link
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          // Where to send them after they click the link in their email
          emailRedirectTo: `${window.location.origin}/results`,
        },
      });

      if (error) {
        throw error;
      }

      setStatusMessage("Magic link sent! Please check your student email inbox.");
      setIsError(false);
    } catch (error) {
      console.error("Login error:", error.message);
      setStatusMessage(error.message || "Failed to send login link. Try again.");
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-6 py-10 font-sans flex flex-col justify-center items-center">
      
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border-2 border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 font-medium">
            Enter your Richfield email to access your living roadmap.
          </p>
        </div>

        <form onSubmit={handleMagicLinkLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Student Email</label>
            <input 
              required 
              type="email" 
              className="w-full px-5 py-4 text-lg bg-gray-50 border-2 border-gray-200 rounded-2xl shadow-inner focus:border-blue-500 focus:bg-white outline-none transition-all text-gray-900 font-semibold"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="e.g. 123456789@my.richfield.ac.za" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full bg-blue-700 text-white font-black text-lg py-4 rounded-2xl shadow-lg hover:bg-blue-800 active:scale-95 transition-all flex justify-center items-center gap-2 uppercase tracking-wide ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? "SENDING LINK..." : "SEND MAGIC LINK"}
            {!isLoading && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </form>

        {/* Status Message Display */}
        {statusMessage && (
          <div className={`mt-6 p-4 rounded-xl text-sm font-bold border-2 text-center ${isError ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
            {statusMessage}
          </div>
        )}

      </div>
      
      <div className="mt-8 text-center">
        <button onClick={() => window.location.href = '/'} className="text-blue-600 font-bold hover:underline text-sm">
          Don't have a roadmap yet? Take the assessment.
        </button>
      </div>

    </div>
  );
}