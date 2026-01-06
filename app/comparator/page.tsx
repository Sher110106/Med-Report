"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import ComparatorResults from "@/components/ComparatorResults";

export default function ComparatorPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState<any>(null);
  const [error, setError] = useState<string | undefined>();
  const [ocrText, setOcrText] = useState<string | undefined>();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(undefined);
    setResultData(null);
    setOcrText(undefined);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/compare", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        setResultData(result);
        setOcrText(result.ocrText);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      setError(err.message || "Processing failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const models = [
    { name: "DeepSeek V3.2", category: "Open Reasoning", color: "blue" },
    { name: "GLM 4.7", category: "Open Reasoning", color: "blue" },
    { name: "Kimi K2 Thinking", category: "Open Reasoning", color: "blue" },
    { name: "Qwen2.5-72B", category: "Open General", color: "purple" },
    { name: "Claude Sonnet 4.5", category: "Closed-Source", color: "orange" },
    { name: "Gemini Pro 3.0", category: "Closed-Source", color: "green" },
    { name: "GPT-5-mini", category: "Closed-Source", color: "teal" },
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Model Comparator
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6 tracking-tight">
              Compare All
              <span className="block text-gray-400">Models at Once</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Upload a handwritten medical note and run{" "}
              <span className="text-black font-medium">9 different AI models</span> in parallel.
              Compare their SOAP extraction results side-by-side.
            </p>
          </div>
        </div>
      </section>

      {/* Models Overview */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-lg font-semibold text-center mb-6">Models Being Compared</h3>
          <div className="flex flex-wrap justify-center gap-3">
            {models.map((model, index) => (
              <div
                key={index}
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  model.color === "blue"
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : model.color === "purple"
                    ? "bg-purple-50 border-purple-200 text-purple-800"
                    : model.color === "orange"
                    ? "bg-orange-50 border-orange-200 text-orange-800"
                    : model.color === "green"
                    ? "bg-green-50 border-green-200 text-green-800"
                    : "bg-teal-50 border-teal-200 text-teal-800"
                }`}
              >
                {model.name}
                <span className="ml-2 text-xs opacity-70">({model.category})</span>
              </div>
            ))}
            <div className="px-4 py-2 rounded-full text-sm font-medium border bg-gray-100 border-gray-300 text-gray-500">
              OpenBioLLM-70B <span className="ml-1 text-xs">(Coming Soon)</span>
            </div>
            <div className="px-4 py-2 rounded-full text-sm font-medium border bg-gray-100 border-gray-300 text-gray-500">
              Meditron-70B <span className="ml-1 text-xs">(Coming Soon)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-black">Run Comparison</h2>
            <p className="text-gray-600 mt-2">
              Upload a handwritten note to compare all models
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
                  Running All Models...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Run 9-Model Comparison
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              )}
            </button>

            {error && (
              <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* OCR Text Display */}
            {ocrText && (
              <div className="w-full max-w-4xl bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold mb-3 text-black flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  OCR Text (Input to All Models)
                </h3>
                <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200 max-h-64 overflow-y-auto">
                  {ocrText}
                </pre>
              </div>
            )}

            {resultData && <ComparatorResults data={resultData} />}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>Model Comparator — Run 9 AI Models in Parallel for Medical Note Extraction</p>
        </div>
      </footer>
    </main>
  );
}
