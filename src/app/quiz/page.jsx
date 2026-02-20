"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import questions from "../../data/questions.json";

export default function QuizScreen() {
  const router = useRouter();
  
  // State Management
  const [currentIndex, setCurrentIndex] = useState(0);
  const [vectorScore, setVectorScore] = useState([0, 0, 0, 0, 0]); // [T, B, P, C, H]
  
  // New States for the Dynamic UI
  const [showFactOverlay, setShowFactOverlay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [factIndex, setFactIndex] = useState(0);

  // Prospectus & Market Facts for between-question transitions
  const transitionFacts = [
    "Fun Fact: Richfield includes IBM, AWS, and CISCO certifications for free.",
    "Market Stat: Cloud Computing is currently one of the highest paying tech sectors in SA.",
    "Fun Fact: Richfield's Entrepreneurship Hub lets you pitch ideas to real investors!",
    "Market Stat: Data Science roles in South Africa have grown by over 40% this year.",
    "Fun Fact: Richfield's BCom degree is formally endorsed by SAICA.",
    "Market Stat: Cybersecurity experts are in massive demand across SA's banking sector.",
    "Fun Fact: Richfield is an official AWS Academy Partner."
  ];

  // Final loading screen facts
  const loadingFacts = [
    "Analyzing your psychological vector...",
    "Matching traits to the 2026 Job Market...",
    "Calculating Cosine Similarity...",
    "Finalizing your Richfield Roadmap!"
  ];

  const handleOptionClick = (weights) => {
    // 1. Tally the score
    const newScore = vectorScore.map((val, index) => val + weights[index]);
    setVectorScore(newScore);

    // 2. Check if we are at the end
    if (currentIndex + 1 < questions.length) {
      // Trigger the inter-question fact overlay
      setShowFactOverlay(true);
      
      // Wait 1.8 seconds, then hide the fact and show the next question
      setTimeout(() => {
        setShowFactOverlay(false);
        setCurrentIndex(currentIndex + 1);
      }, 1800); 
      
    } else {
      // Trigger the grand finale loading screen
      triggerProcessing(newScore);
    }
  };

  const triggerProcessing = (finalScore) => {
    setIsProcessing(true);
    localStorage.setItem("userVector", JSON.stringify(finalScore));

    const factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % loadingFacts.length);
    }, 800);

    setTimeout(() => {
      clearInterval(factInterval);
      router.push("/results");
    }, 3200);
  };

  // --- THE GRAND FINALE LOADING SCREEN ---
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Dynamic Background Elements */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse delay-700"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          <h2 className="text-3xl font-black text-white mb-4 tracking-wide">Processing Data...</h2>
          <p className="text-indigo-200 text-xl font-medium h-12 transition-opacity duration-300">
            {loadingFacts[factIndex]}
          </p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercentage = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-6 py-10 font-sans sm:px-12 relative overflow-hidden">
      
      {/* iOS-Style Dynamic Ambient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-100/50 to-transparent"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl"></div>
      </div>

      {/* The Fact Overlay (Triggers between questions) */}
      <div className={`fixed inset-0 z-50 bg-indigo-600 flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ${showFactOverlay ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4"}`}>
        <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
          <svg className="w-12 h-12 text-white mx-auto mb-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-2xl font-bold text-white leading-snug">
            {transitionFacts[currentIndex % transitionFacts.length]}
          </p>
        </div>
      </div>

      {/* --- THE QUIZ UI --- */}
      <div className="relative z-10 w-full max-w-md mx-auto flex-1 flex flex-col pt-4">
        
        {/* Upgraded Glowing Progress Bar */}
        <div className="mb-10">
          <div className="flex justify-between items-end mb-3">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Question {currentIndex + 1} <span className="text-gray-300 mx-1">/</span> {questions.length}
            </span>
            <span className="text-sm font-black text-indigo-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3.5 shadow-inner overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(99,102,241,0.6)] relative" 
              style={{ width: `${progressPercentage}%` }}
            >
              {/* Shimmer effect inside the bar */}
              <div className="absolute top-0 left-0 bottom-0 right-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
        </div>

        {/* The Question Box */}
        <h2 className="text-3xl font-black text-gray-900 leading-tight mb-8 drop-shadow-sm">
          {currentQuestion.text}
        </h2>

        {/* The Options (Massive iOS-Style Touch Targets) */}
        <div className="space-y-4 pb-10">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option.weights)}
              disabled={showFactOverlay}
              className="w-full text-left p-6 bg-white/80 backdrop-blur-sm border-2 border-gray-100 rounded-3xl shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:border-indigo-400 hover:shadow-[0_8px_20px_rgba(99,102,241,0.15)] active:scale-[0.97] active:bg-indigo-50 transition-all duration-200 group"
            >
              <span className="text-lg font-bold text-gray-700 leading-snug block group-hover:text-indigo-900 transition-colors">
                {option.text}
              </span>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}