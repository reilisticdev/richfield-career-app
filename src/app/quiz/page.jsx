"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 15 Scenario-Based Business & IT Questions for High-Precision Vectoring
const questions = [
  { scenario: "An e-commerce website crashes right as a massive Black Friday sale begins. What is your immediate reaction?", options: [{ text: "Dive into the server logs to locate the exact point of failure.", trait: "Technical" }, { text: "Calculate the estimated revenue lost per minute to prioritize resources.", trait: "Business" }, { text: "Quickly coordinate the engineering and PR teams to manage the crisis.", trait: "Management" }, { text: "Deploy a temporary, creative 'We'll be right back' interactive page.", trait: "Creative" }] },
  { scenario: "A client wants a highly advanced AI feature in their app, but their budget is extremely tight. How do you handle this?", options: [{ text: "Negotiate the project scope to align with their financial realities.", trait: "Business" }, { text: "Find an open-source AI model that can be adapted cheaply.", trait: "Practical" }, { text: "Redesign the user interface so a simpler feature feels advanced.", trait: "Design" }, { text: "Analyze the database architecture to see what's actually feasible.", trait: "Analytical" }] },
  { scenario: "Your company has accumulated massive amounts of user data over 5 years. What should be done with it?", options: [{ text: "Build predictive models to forecast future market trends.", trait: "Analytical" }, { text: "Secure it immediately against potential cybersecurity threats.", trait: "Technical" }, { text: "Use it to design a highly personalized, targeted marketing campaign.", trait: "Creative" }, { text: "Monetize it by identifying new revenue streams and partnerships.", trait: "Business" }] },
  { scenario: "A software development team is consistently missing their sprint deadlines. How do you intervene?", options: [{ text: "Audit their code commits to identify technical bottlenecks.", trait: "Technical" }, { text: "Implement an Agile framework like Scrum to organize their workflow.", trait: "Management" }, { text: "Host a whiteboard session to creatively brainstorm workflow solutions.", trait: "Collaborative" }, { text: "Analyze their time-tracking data to find inefficiencies.", trait: "Analytical" }] },
  { scenario: "You are tasked with pitching a new tech product to investors. What is the core of your presentation?", options: [{ text: "The financial projections, ROI, and market scalability.", trait: "Business" }, { text: "A visually stunning prototype and brand identity.", trait: "Creative" }, { text: "The flawless, secure, and innovative backend architecture.", trait: "Technical" }, { text: "The data-backed research proving market demand.", trait: "Analytical" }] },
  { scenario: "A user reports a critical security vulnerability in your system. What is the first step?", options: [{ text: "Patch the code and deploy a hotfix immediately.", trait: "Technical" }, { text: "Draft a transparent communication strategy for stakeholders.", trait: "Management" }, { text: "Trace the vulnerability back to its architectural origin.", trait: "Analytical" }, { text: "Assess the potential legal and financial liabilities.", trait: "Business" }] },
  { scenario: "You are designing a brand new mobile banking app. What is your primary focus?", options: [{ text: "Ensuring end-to-end encryption and zero-latency transactions.", trait: "Technical" }, { text: "Creating a sleek, intuitive, and modern user interface (UI).", trait: "Design" }, { text: "Mapping the user journey using behavioral analytics.", trait: "Analytical" }, { text: "Structuring the app to cross-sell financial products.", trait: "Business" }] },
  { scenario: "Your startup has just received $1 Million in funding. Where do you allocate the majority of it?", options: [{ text: "Hiring elite software engineers and upgrading infrastructure.", trait: "Technical" }, { text: "Aggressive digital marketing and brand expansion.", trait: "Creative" }, { text: "Acquiring smaller competitors to expand market share.", trait: "Business" }, { text: "Building a strong management team to scale operations safely.", trait: "Management" }] },
  { scenario: "An API integration with a third-party service is failing silently. How do you troubleshoot?", options: [{ text: "Write a script to automate error testing until it breaks.", trait: "Technical" }, { text: "Map the data flow diagram to spot the logical disconnect.", trait: "Analytical" }, { text: "Contact the third-party vendor to negotiate better support SLAs.", trait: "Business" }, { text: "Assign your best debugging specialist to own the problem.", trait: "Management" }] },
  { scenario: "You have to explain a highly complex technical concept to a non-technical CEO. How do you do it?", options: [{ text: "Use visual analogies and a beautifully designed infographic.", trait: "Creative" }, { text: "Translate the tech jargon into financial impacts and ROI.", trait: "Business" }, { text: "Break it down into a step-by-step logical process.", trait: "Analytical" }, { text: "Provide a high-level summary and delegate the details.", trait: "Management" }] },
  { scenario: "A new technology (like Quantum Computing or AGI) disrupts your industry. What is your move?", options: [{ text: "Immediately start learning the underlying programming languages.", trait: "Technical" }, { text: "Analyze the data to see if the disruption is a fad or permanent.", trait: "Analytical" }, { text: "Re-evaluate the company's 5-year business strategy.", trait: "Business" }, { text: "Brainstorm new products that could utilize this technology.", trait: "Creative" }] },
  { scenario: "Your team is launching a new software update, but user feedback from beta testing is terrible. What now?", options: [{ text: "Delay the launch to rewrite the problematic code.", trait: "Technical" }, { text: "Redesign the UX/UI based on the users' complaints.", trait: "Design" }, { text: "Analyze the feedback data to categorize the most critical bugs.", trait: "Analytical" }, { text: "Push the launch but offer the update at a discounted rate.", trait: "Business" }] },
  { scenario: "You are placed in charge of migrating a company to a Cloud Infrastructure (AWS/Azure). What is your priority?", options: [{ text: "Configuring the servers, firewalls, and subnets correctly.", trait: "Technical" }, { text: "Ensuring the migration doesn't exceed the allocated budget.", trait: "Business" }, { text: "Managing the timeline so normal business operations aren't halted.", trait: "Management" }, { text: "Designing a logical map of how the new architecture will flow.", trait: "Analytical" }] },
  { scenario: "A marketing campaign goes viral, bringing 100x normal traffic to your site. What happens?", options: [{ text: "The auto-scaling load balancers handle it perfectly.", trait: "Technical" }, { text: "Sales skyrocket and you immediately calculate profit margins.", trait: "Business" }, { text: "You quickly design a new landing page to capture the leads.", trait: "Creative" }, { text: "You gather the analytics data to study the demographic spike.", trait: "Analytical" }] },
  { scenario: "Fast forward 10 years. What is your ultimate career legacy?", options: [{ text: "I engineered a flawless system that millions of people use.", trait: "Technical" }, { text: "I built a highly profitable, self-sustaining tech empire.", trait: "Business" }, { text: "I led incredible teams to achieve things they thought impossible.", trait: "Management" }, { text: "I designed a product that fundamentally changed human behavior.", trait: "Creative" }] }
];

const richfieldFacts = [
  "Did you know? Richfield integrates AWS, CISCO, and IBM badges directly into your degree modules.",
  "Richfield has been shaping future-ready tech and business professionals for over 35 years.",
  "The BCom SAICA pathway lets you proceed to a SAICA accredited CTA (PGDA) at universities nationwide.",
  "Over 90% of Richfield IT graduates secure employment within six months of completion.",
  "Richfield's Entrepreneurship Hub provides funding and mentorship for top student tech startups.",
  "Your 1st Year BSc IT degree contains exactly 130 credits to build an unbreakable foundation.",
  "Richfield Bootcamps give you hands-on, practical experience outside of normal lectures.",
  "Students have access to comprehensive mental health and wellness policies on all campuses."
];

export default function GamifiedQuiz() {
  const router = useRouter();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Transition State
  const [showFactTransition, setShowFactTransition] = useState(false);
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem("richfieldUser")) {
      router.push("/");
    }
  }, [router]);

  const handleSelect = (trait) => {
    const newAnswers = { ...answers, [currentQ]: trait };
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      // Trigger the 3-second Fun Fact Animation
      setShowFactTransition(true);
      setTimeout(() => {
        setShowFactTransition(false);
        setCurrentQ(currentQ + 1);
        setFactIndex((prev) => (prev + 1) % richfieldFacts.length);
      }, 3000);
    } else {
      // End of Quiz: Submit
      setIsSubmitting(true);
      const vector = Object.values(newAnswers).reduce((acc, curr) => {
        acc[curr] = (acc[curr] || 0) + 1;
        return acc;
      }, {});
      localStorage.setItem("userVector", JSON.stringify(vector));
      
      // Send them to results
      setTimeout(() => {
        router.push("/results");
      }, 1000);
    }
  };

  const progressPercentage = ((currentQ) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 relative font-sans overflow-hidden">
      
      {/* Gamified Background Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10">
        
        {/* Dynamic Progress Bar */}
        <div className="mb-10 bg-slate-800/50 p-6 rounded-3xl border border-slate-700 backdrop-blur-md">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Scenario Analysis</h2>
              <p className="text-2xl font-black text-white">Level {currentQ + 1} <span className="text-slate-500">/ {questions.length}</span></p>
            </div>
            <div className="text-blue-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">
              {Math.round(progressPercentage)}%
            </div>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden shadow-inner border border-slate-800">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out relative" 
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Animated highlight on the progress bar */}
              <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* --- STATE 1: FINAL SUBMISSION LOADING --- */}
        {isSubmitting ? (
          <div className="bg-slate-800/80 p-12 rounded-[2.5rem] shadow-2xl border border-slate-700 text-center backdrop-blur-xl animate-in zoom-in duration-500">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 border-8 border-slate-700 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-3xl font-black text-white mb-3">Architecting Roadmap...</h3>
            <p className="text-blue-400 font-bold uppercase tracking-widest text-sm animate-pulse">Mapping Vector to Richfield Curriculum</p>
          </div>
        ) 
        
        /* --- STATE 2: THE 3-SECOND FUN FACT TRANSITION --- */
        : showFactTransition ? (
          <div className="bg-blue-600 p-10 sm:p-14 rounded-[2.5rem] shadow-2xl border border-blue-500 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-bounce">
              <span className="text-3xl">🎓</span>
            </div>
            <h3 className="text-sm font-black text-blue-200 uppercase tracking-widest mb-4">While we process that...</h3>
            <p className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {richfieldFacts[factIndex]}
            </p>
            <div className="w-full bg-blue-800 h-2 mt-10 rounded-full overflow-hidden">
              <div className="bg-white h-full animate-[progress_3s_ease-in-out_forwards]"></div>
            </div>
          </div>
        ) 
        
        /* --- STATE 3: THE SCENARIO QUESTION --- */
        : (
          <div className="bg-slate-800/80 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-700 backdrop-blur-xl animate-in slide-in-from-right-8 duration-300">
            <div className="inline-block bg-blue-500/20 text-blue-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest mb-6 border border-blue-500/30">
              Scenario {currentQ + 1}
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-black text-white mb-8 leading-tight">
              {questions[currentQ].scenario}
            </h3>
            
            <div className="space-y-4">
              {questions[currentQ].options.map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSelect(opt.trait)} 
                  className="w-full text-left p-5 sm:p-6 bg-slate-900/50 border-2 border-slate-700 rounded-2xl hover:border-blue-500 hover:bg-slate-800 text-slate-300 hover:text-white transition-all duration-200 group flex items-center justify-between shadow-sm"
                >
                  <span className="font-semibold text-base sm:text-lg pr-4">
                    {opt.text}
                  </span>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-600 group-hover:border-blue-500 flex items-center justify-center transition-colors shrink-0 shadow-inner">
                    <div className="w-2 h-2 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Global CSS for the 3-second loader bar */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />

    </div>
  );
}