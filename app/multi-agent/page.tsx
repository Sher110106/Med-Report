"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import MultiAgentResults from "@/components/MultiAgentResults";

export default function MultiAgentPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | undefined>();
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(undefined);
    setResultData(null);
    setCurrentStep(1);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      // Simulate step progress
      const stepInterval = setInterval(() => {
        setCurrentStep((prev) => (prev < 4 ? prev + 1 : prev));
      }, 3000);

      const response = await fetch("/api/multi-agent", {
        method: "POST",
        body: formData,
      });

      clearInterval(stepInterval);
      setCurrentStep(4);

      const result = await response.json();
      if (result.success) {
        setResultData(result);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Processing failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setCurrentStep(0);
    }
  };

  const pipelineSteps = [
    {
      step: 1,
      title: "Handwritten OCR",
      modelA: "Gemini Flash",
      modelB: "Azure GPT-4o",
      description: "Convert handwritten image to raw text",
    },
    {
      step: 2,
      title: "Classification",
      modelA: "Gemini Pro",
      modelB: "GPT-5-mini",
      description: "Classify document type and correct OCR",
    },
    {
      step: 3,
      title: "Entity Extraction",
      modelA: "Gemini Pro",
      modelB: "GPT-5-mini",
      description: "Extract SOAP note entities with confidence",
    },
    {
      step: 4,
      title: "Labs Extraction",
      modelA: "Gemini Pro",
      modelB: "GPT-5-mini",
      description: "Extract lab values and diagnostics",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-black transition-colors group"
          >
            <svg
              className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <div
            className={`text-center transform transition-all duration-1000 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white text-sm font-medium mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              Multi-Agent System
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6 tracking-tight">
              Dual-Model
              <span className="block text-gray-400">Medical Extraction</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              A research-backed approach where{" "}
              <span className="text-black font-medium">two AI models</span> process each step, using{" "}
              <span className="text-black font-medium">confidence scores</span> to select the most accurate result.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Architecture</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-black mt-2">How Multi-Agent Works</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
            {pipelineSteps.map((step, index) => (
              <div
                key={step.step}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
                  currentStep === step.step
                    ? "border-black bg-gray-50 scale-105"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* Step Number */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mb-4 ${
                    currentStep === step.step ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {currentStep === step.step ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  ) : (
                    step.step
                  )}
                </div>

                <h3 className="text-lg font-semibold text-black mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{step.description}</p>

                {/* Model Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {step.modelA}
                  </span>
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                    {step.modelB}
                  </span>
                </div>

                {/* Arrow */}
                {index < pipelineSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Decision Logic Box */}
          <div className="bg-black rounded-2xl p-8 text-white">
            <h3 className="text-xl font-bold mb-4 text-center">Confidence-Based Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Clear Winner</h4>
                <p className="text-sm text-gray-400">
                  If one model's confidence is 10%+ higher, select that result automatically.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Similar Confidence</h4>
                <p className="text-sm text-gray-400">
                  When scores are close, prefer the primary model (Gemini) as tie-breaker.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <h4 className="font-semibold mb-2">Low Confidence</h4>
                <p className="text-sm text-gray-400">
                  If both models score below 60%, a validator model reviews both outputs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Processing Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Try Multi-Agent Extraction</h2>
            <p className="text-gray-600 mt-2">
              Upload a handwritten medical note to see the dual-model pipeline in action
            </p>
          </div>

          <div className="flex flex-col items-center space-y-6">
            <ImageUploader onImageSelect={setSelectedFile} />

            <button
              onClick={handleProcess}
              disabled={!selectedFile || isProcessing}
              className={`px-8 py-4 rounded-full font-medium text-lg transition-all duration-300 ${
                !selectedFile || isProcessing
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800 hover:scale-105"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing Step {currentStep} of 4...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Run Multi-Agent Pipeline
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              )}
            </button>

            {error && (
              <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <strong>Error:</strong> {error}
              </div>
            )}

            {resultData && <MultiAgentResults data={resultData} />}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Multi-Agent Medical Extraction — Dual-Model Pipeline with Confidence-Based Selection</p>
        </div>
      </footer>
    </main>
  );
}
