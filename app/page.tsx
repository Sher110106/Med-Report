"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => setFeaturesVisible(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      title: "Single Agent",
      description: "Traditional single-model extraction using Gemini or Azure GPT for converting handwritten notes to structured SOAP/Labs format.",
      href: "/extract",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: "blue",
    },
    {
      title: "Multi-Agent",
      description: "Dual-model pipeline where two AI models process each step, using confidence scores to select the most accurate result.",
      href: "/multi-agent",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: "purple",
    },
    {
      title: "Comparator",
      description: "Run 9 AI models in parallel and compare results side-by-side. Includes DeepSeek, GLM, Kimi, Claude, Gemini, and more.",
      href: "/comparator",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: "green",
    },
    {
      title: "Survey",
      description: "Physician evaluation interface for rating model outputs. Powers the research study for benchmarking extraction quality.",
      href: "#",
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: "orange",
      comingSoon: true,
    },
  ];

  const modelCategories = [
    {
      category: "Closed-Source (Performance Ceiling)",
      models: ["GPT-5-mini (Azure)", "Gemini Pro 3.0 (Google)", "Claude Sonnet 4.5 (Anthropic)"],
      color: "orange",
    },
    {
      category: "Open Reasoning (Explicit Thinking)",
      models: ["DeepSeek V3.2", "GLM 4.7", "Kimi K2 Thinking"],
      color: "blue",
    },
    {
      category: "Open Medical (Specialization)",
      models: ["OpenBioLLM-70B", "Llama-3-Meditron-70B", "Qwen2.5-72B-Instruct"],
      color: "purple",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(to right, black 1px, transparent 1px),
                              linear-gradient(to bottom, black 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 py-24 sm:py-32 relative">
          <div 
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-black mb-8">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black mb-6 tracking-tight">
              Medical Note
              <span className="block text-gray-400">Extraction Study</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto mb-8 leading-relaxed">
              Evaluating how <span className="text-black font-medium">9 state-of-the-art AI models</span> compare 
              at converting handwritten clinical notes into structured SOAP representations.
            </p>

            <p className="text-lg text-gray-500 max-w-3xl mx-auto mb-12">
              Research question: How do closed-source, open-source reasoning, and medical-specialized 
              models perform under real-world conditions, as evaluated by practicing physicians?
            </p>
          </div>
        </div>

        <div className="absolute top-1/4 left-10 w-72 h-72 bg-gray-100 rounded-full filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-gray-200 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      </section>

      {/* Feature Cards */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div 
            className={`text-center mb-16 transform transition-all duration-1000 delay-300 ${
              featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Processing Modes</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-black mt-2 mb-4">
              Choose Your Approach
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From single-model extraction to full 9-model comparison
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={feature.href}
                className={`group relative p-6 bg-white rounded-2xl border-2 transition-all duration-500 transform hover:-translate-y-1 ${
                  feature.comingSoon 
                    ? 'border-gray-200 cursor-default opacity-60' 
                    : 'border-gray-200 hover:border-black hover:shadow-lg'
                }`}
                onClick={feature.comingSoon ? (e) => e.preventDefault() : undefined}
              >
                {feature.comingSoon && (
                  <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                    Coming Soon
                  </span>
                )}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 ${
                  feature.color === 'blue' ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                  feature.color === 'purple' ? 'bg-purple-100 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                  feature.color === 'green' ? 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white' :
                  'bg-orange-100 text-orange-600 group-hover:bg-orange-600 group-hover:text-white'
                }`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                {!feature.comingSoon && (
                  <div className="mt-4 flex items-center text-sm font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity">
                    Try it
                    <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Models Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Model Selection</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-black mt-2 mb-4">
              9 Models Under Evaluation
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Covering closed-source leaders, open-source reasoning models with explicit thinking, 
              and medical-specialized variants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {modelCategories.map((cat, index) => (
              <div
                key={index}
                className={`p-6 rounded-2xl border-2 ${
                  cat.color === 'orange' ? 'border-orange-200 bg-orange-50/50' :
                  cat.color === 'blue' ? 'border-blue-200 bg-blue-50/50' :
                  'border-purple-200 bg-purple-50/50'
                }`}
              >
                <h3 className={`text-lg font-semibold mb-4 ${
                  cat.color === 'orange' ? 'text-orange-800' :
                  cat.color === 'blue' ? 'text-blue-800' :
                  'text-purple-800'
                }`}>
                  {cat.category}
                </h3>
                <ul className="space-y-2">
                  {cat.models.map((model, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700">
                      <div className={`w-2 h-2 rounded-full ${
                        cat.color === 'orange' ? 'bg-orange-500' :
                        cat.color === 'blue' ? 'bg-blue-500' :
                        'bg-purple-500'
                      }`} />
                      {model}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Question */}
      <section className="py-24 bg-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Research Hypotheses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">H1: Reasoning Dividend</h3>
              <p className="text-gray-400 text-sm">
                Reasoning models (DeepSeek, GLM, Kimi) will show reduced hallucinations due to explicit chain-of-thought.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">H2: Alignment Tax</h3>
              <p className="text-gray-400 text-sm">
                Medical-tuned models show better terminology but may have lower instruction-following.
              </p>
            </div>
            <div className="bg-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-2">H3: Closed vs Open Gap</h3>
              <p className="text-gray-400 text-sm">
                Performance gap between GPT-5-mini and DeepSeek will be &lt;10% on quality but &gt;20% on safety.
              </p>
            </div>
          </div>
          <Link
            href="/comparator"
            className="mt-10 group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-black bg-white rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105"
          >
            Start Comparing Models
            <svg 
              className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Medical Note Extraction Study — Evaluating AI Models for Clinical Documentation</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(30px, 10px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 8s ease-in-out infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </main>
  );
}
