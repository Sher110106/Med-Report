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

  const architectureSteps = [
    {
      step: "1",
      title: "Handwritten OCR",
      description: "Convert handwritten clinical images into raw text using advanced vision models.",
    },
    {
      step: "2",
      title: "Entity Extraction",
      description: "Identify clinically meaningful entities: medications, dosages, diagnoses, identifiers, and findings.",
    },
    {
      step: "3",
      title: "Normalization",
      description: "Map noisy extracted strings to standardized concepts, correcting spellings and mapping to medical ontologies.",
    },
    {
      step: "4",
      title: "Relation Extraction",
      description: "Link entities together (medication ↔ dosage ↔ frequency) and output in structured form.",
    },
  ];

  const promptEvolution = [
    {
      phase: "Phase 1",
      title: "Standardization",
      goal: "Solve unstructured outputs",
      technique: "Added constraints to force JSON formatting and structured answers.",
    },
    {
      phase: "Phase 2",
      title: "Evidence & Logic",
      goal: "Reduce hallucinations",
      technique: "Required model to explicitly cite evidence from text. If no evidence, answer 'Unknown'.",
    },
    {
      phase: "Phase 3",
      title: "Chain of Thought",
      goal: "Improve accuracy",
      technique: "Forced extraction of intermediate variables before making final classifications.",
    },
    {
      phase: "Phase 4",
      title: "Few-Shot Examples",
      goal: "Complex logic",
      technique: "Provided specific examples demonstrating deduction patterns for edge cases.",
    },
  ];

  const modelSelection = [
    {
      model: "Gemini Flash",
      purpose: "OCR Extraction",
      reason: "Optimized for fast, high-quality image-to-text conversion with excellent handwriting recognition capabilities.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      model: "Gemini Pro",
      purpose: "Structured Extraction",
      reason: "Superior reasoning capabilities for complex medical entity extraction and relationship mapping.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      model: "Azure GPT-5-mini",
      purpose: "Alternative Pipeline",
      reason: "Enhanced accuracy in medical terminology with different training data, providing comparison for validation.",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
  ];

  const schemaFeatures = [
    {
      title: "SOAP Note Format",
      description: "Subjective, Objective, Assessment, Plan — the gold standard for clinical documentation.",
      fields: ["Chief Complaint", "History of Present Illness", "Vitals & Examination", "Diagnosis", "Treatment Plan"],
    },
    {
      title: "Labs & Diagnostics",
      description: "Specialized schema for laboratory results and diagnostic findings.",
      fields: ["Ordered Tests", "Result Values", "Reference Ranges", "Abnormal Flags", "Medications"],
    },
  ];

  const technicalTechniques = [
    {
      title: "Schema Placeholder Replacement",
      description: "Defining distinct 'buckets' for labs_ordered vs labs_resulted ensures specific entities are captured even when values are missing.",
    },
    {
      title: "Layout-Agnostic Parsing",
      description: "Pattern-based entity recognition prioritizes medical patterns (e.g., 'Tab.', 'mg') over OCR headers.",
    },
    {
      title: "Spiral Validation Loop",
      description: "Forcing output of original_text and confidence_score creates a 'Chain of Trust' that reduces hallucinations.",
    },
    {
      title: "Contextual Pre-correction",
      description: "Model is primed to fix visually similar character errors (S6PT → SGPT) using internal medical knowledge.",
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
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-black mb-8 animate-pulse">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black mb-6 tracking-tight">
              Medical Note
              <span className="block text-gray-400">Extractor</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              Transform handwritten doctor's notes into structured, 
              <span className="text-black font-medium"> machine-readable data</span> using 
              advanced AI models and research-backed prompt engineering.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/extract"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-white bg-black rounded-full hover:bg-gray-800 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                Try the Extractor
                <svg 
                  className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/multi-agent"
                className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-black bg-white border-2 border-black rounded-full hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Multi-Agent Mode
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
          </div>
        </div>

        <div className="absolute top-1/4 left-10 w-72 h-72 bg-gray-100 rounded-full filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-gray-200 rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
      </section>

      {/* Architecture Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div 
            className={`text-center mb-16 transform transition-all duration-1000 delay-300 ${
              featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}
          >
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Research-Backed</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-black mt-2 mb-4">
              Our Architecture
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Following the architecture established by leading medical NLP research papers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {architectureSteps.map((step, index) => (
              <div
                key={index}
                className={`relative p-6 bg-white rounded-2xl border border-gray-200 hover:border-black hover:shadow-lg transition-all duration-500 transform hover:-translate-y-1 ${
                  featuresVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
                style={{ transitionDelay: `${400 + index * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center text-lg font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
                {index < architectureSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prompt Engineering Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Spiral Prompt Engineering</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-black mt-2 mb-4">
              How We Built Our Prompts
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              An iterative methodology where prompts are refined in phases to address specific failure modes 
              like hallucinations and formatting errors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            {promptEvolution.map((phase, index) => (
              <div
                key={index}
                className="group p-6 bg-white rounded-2xl border border-gray-200 hover:border-black transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-black group-hover:text-white flex items-center justify-center font-bold transition-all duration-300">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{phase.phase}</div>
                    <h3 className="text-xl font-semibold text-black mb-1">{phase.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">Goal: {phase.goal}</p>
                    <p className="text-gray-600 text-sm">{phase.technique}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Technical Techniques */}
          <div className="bg-black rounded-3xl p-8 md:p-12">
            <h3 className="text-2xl font-bold text-white mb-8 text-center">Key Techniques</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {technicalTechniques.map((technique, index) => (
                <div key={index} className="bg-white/10 backdrop-blur rounded-xl p-6 hover:bg-white/20 transition-all duration-300">
                  <h4 className="text-lg font-semibold text-white mb-2">{technique.title}</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{technique.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Model Selection Section */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">AI Models</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-black mt-2 mb-4">
              Why We Chose These Models
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Each model is selected for its specific strengths in the medical extraction pipeline
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {modelSelection.map((model, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-gray-200 p-8 hover:border-black hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1"
              >
                <div className="w-14 h-14 rounded-xl bg-gray-100 group-hover:bg-black group-hover:text-white text-gray-700 flex items-center justify-center mb-6 transition-all duration-300">
                  {model.icon}
                </div>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{model.purpose}</div>
                <h3 className="text-xl font-bold text-black mb-3">{model.model}</h3>
                <p className="text-gray-600 leading-relaxed">{model.reason}</p>
              </div>
            ))}
          </div>

          {/* Pipeline Diagram */}
          <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
            <h3 className="text-xl font-bold text-black mb-6 text-center">Two-Stage Pipeline</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="font-semibold">Image Input</div>
              </div>
              <svg className="w-8 h-8 text-gray-300 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="font-semibold text-black">Stage 1: OCR</div>
                <div className="text-sm text-gray-500">Gemini Flash</div>
              </div>
              <svg className="w-8 h-8 text-gray-300 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <div className="font-semibold text-black">Stage 2: Extract</div>
                <div className="text-sm text-gray-500">Gemini Pro / GPT-5-mini</div>
              </div>
              <svg className="w-8 h-8 text-gray-300 rotate-90 md:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="font-semibold">Structured JSON</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Output Schema Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Output Formats</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-black mt-2 mb-4">
              Structured Output Schemas
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Schema-driven extraction with predefined key-value structures significantly improves 
              accuracy and consistency compared to free-form outputs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {schemaFeatures.map((schema, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-2xl font-bold text-black mb-3">{schema.title}</h3>
                <p className="text-gray-600 mb-6">{schema.description}</p>
                <div className="space-y-2">
                  {schema.fields.map((field, fieldIndex) => (
                    <div key={fieldIndex} className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-black"></div>
                      <span className="text-gray-700">{field}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Schema Benefits */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-black mb-2">Consistent Structure</h4>
              <p className="text-sm text-gray-600">Every extraction follows the same schema, ensuring predictable outputs</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-black mb-2">Reduced Hallucinations</h4>
              <p className="text-sm text-gray-600">Constrained outputs minimize fabricated information</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold text-black mb-2">Easy Integration</h4>
              <p className="text-sm text-gray-600">JSON output ready for database storage or API consumption</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Extract Your Medical Notes?
          </h2>
          <p className="text-lg text-gray-400 mb-10">
            Experience the power of research-backed prompt engineering and multi-model pipelines.
          </p>
          <Link
            href="/extract"
            className="group inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-black bg-white rounded-full hover:bg-gray-100 transition-all duration-300 hover:scale-105"
          >
            Start Extracting
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
          <p>Medical Note Extractor — AI-Powered Document Processing with Spiral Prompt Engineering</p>
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
