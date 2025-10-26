'use client'

import { useState } from 'react';
import { Volume2, Users, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InterviewPrep() {
  const [currentStage, setCurrentStage] = useState(0);
  const router = useRouter();

  const stages = [
    {
      icon: Users,
      title: "Find a Quiet Space",
      description: "Make sure you're in a quiet area and alone. This ensures privacy and minimizes distractions during your interview.",
      tips: [
        "Close doors and windows to reduce outside noise",
        "Let others know you're in an interview",
        "Turn off TV, music, and notifications"
      ]
    },
    {
      icon: Volume2,
      title: "Check Your Audio",
      description: "Speak loud enough to be heard clearly. Your responses need to be captured accurately for evaluation.",
      tips: [
        "Speak at a normal conversational volume",
        "Avoid whispering or shouting",
        "Test your microphone before starting"
      ]
    },
    {
      icon: CheckCircle,
      title: "Ready to Begin",
      description: "You'll be asked behavioral questions about your past experiences. Take your time and provide detailed, honest answers.",
      tips: [
        "Use the STAR method (Situation, Task, Action, Result)",
        "Be specific with examples from your experience",
        "There's no time limit - answer thoroughly"
      ]
    }
  ];

  const handleNext = () => {
    if (currentStage < stages.length - 1) {
      setCurrentStage(currentStage + 1);
    }
  };

  const handleBack = () => {
    if (currentStage > 0) {
      setCurrentStage(currentStage - 1);
    }
  };

   const handleStart = () => {
      router.push('http://localhost:3000/rooms/test-room')
   };

  const CurrentIcon = stages[currentStage].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Progress Indicators */}
        <div className="flex justify-center gap-2 mb-12">
          {stages.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStage
                  ? 'w-12 bg-indigo-600'
                  : index < currentStage
                  ? 'w-8 bg-indigo-400'
                  : 'w-8 bg-slate-300'
              }`}
            />
          ))}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
              <CurrentIcon className="w-10 h-10 text-indigo-600" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-6 mb-10">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">
                Step {currentStage + 1} of {stages.length}
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                {stages[currentStage].title}
              </h2>
            </div>
            
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl mx-auto">
              {stages[currentStage].description}
            </p>

            {/* Tips */}
            <div className="bg-slate-50 rounded-xl p-6 mt-8">
              <ul className="space-y-3 text-left">
                {stages[currentStage].tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                    <span className="text-slate-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {currentStage > 0 && (
              <button
                onClick={handleBack}
                className="flex-1 px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-semibold hover:border-slate-400 hover:bg-slate-50 transition-all"
              >
                Back
              </button>
            )}
            
            {currentStage < stages.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all hover:shadow-lg flex items-center justify-center gap-2 group"
              >
                Next
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="flex-1 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-all hover:shadow-lg flex items-center justify-center gap-2"
              >
                Start Interview
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Skip Option */}
        {currentStage < stages.length - 1 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setCurrentStage(stages.length - 1)}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              Skip instructions
            </button>
          </div>
        )}
      </div>
    </div>
  );
}