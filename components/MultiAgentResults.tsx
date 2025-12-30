"use client";

import { useState } from "react";

interface ModelResult {
  name: string;
  result: any;
  confidence: number;
  processingTime: number;
}

interface StepResult {
  modelA: ModelResult;
  modelB: ModelResult;
  selected: "A" | "B" | "VALIDATED";
  selectedResult: any;
  selectionReason: string;
}

interface MultiAgentData {
  success: boolean;
  steps: {
    ocr: StepResult;
    classification: StepResult;
    extraction: StepResult;
    labs?: StepResult;
  };
  finalResult: any;
  totalProcessingTime: number;
  pipelineTrace: string[];
}

interface MultiAgentResultsProps {
  data: MultiAgentData;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const getColor = () => {
    if (confidence >= 0.85) return "bg-green-100 text-green-800 border-green-200";
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getColor()}`}>
      {(confidence * 100).toFixed(0)}%
    </span>
  );
}

function StepCard({
  title,
  step,
  stepNumber,
  isExpanded,
  onToggle,
}: {
  title: string;
  step: StepResult;
  stepNumber: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const selectedModel = step.selected === "A" ? step.modelA : step.modelB;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
            {stepNumber}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-black">{title}</h3>
            <p className="text-sm text-gray-500">
              Selected: {selectedModel.name} • {selectedModel.processingTime}ms
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceBadge confidence={selectedModel.confidence} />
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* Model Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Model A */}
            <div
              className={`p-4 rounded-lg border-2 ${
                step.selected === "A" ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-black">{step.modelA.name}</span>
                <ConfidenceBadge confidence={step.modelA.confidence} />
              </div>
              <div className="text-xs text-gray-500 mb-2">{step.modelA.processingTime}ms</div>
              {step.selected === "A" && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Selected
                </span>
              )}
            </div>

            {/* Model B */}
            <div
              className={`p-4 rounded-lg border-2 ${
                step.selected === "B" ? "border-green-500 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-black">{step.modelB.name}</span>
                <ConfidenceBadge confidence={step.modelB.confidence} />
              </div>
              <div className="text-xs text-gray-500 mb-2">{step.modelB.processingTime}ms</div>
              {step.selected === "B" && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Selected
                </span>
              )}
            </div>
          </div>

          {/* Selection Reason */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>Decision:</strong> {step.selectionReason}
            </p>
          </div>

          {/* Result Preview */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Output Preview:</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-48">
              {JSON.stringify(step.selectedResult, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MultiAgentResults({ data }: MultiAgentResultsProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1]));
  const [showTrace, setShowTrace] = useState(false);

  const toggleStep = (step: number) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(step)) {
        newSet.delete(step);
      } else {
        newSet.add(step);
      }
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      {/* Header Stats */}
      <div className="bg-gradient-to-r from-black to-gray-800 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-4">Multi-Agent Extraction Results</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-gray-400 text-sm">Total Time</div>
            <div className="text-xl font-semibold">{(data.totalProcessingTime / 1000).toFixed(2)}s</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Scenario</div>
            <div className="text-xl font-semibold">{data.finalResult.scenario}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Steps Completed</div>
            <div className="text-xl font-semibold">{data.steps.labs ? 4 : 3}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm">Models Used</div>
            <div className="text-xl font-semibold">2 per step</div>
          </div>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="space-y-4">
        <StepCard
          title="Handwritten OCR"
          step={data.steps.ocr}
          stepNumber={1}
          isExpanded={expandedSteps.has(1)}
          onToggle={() => toggleStep(1)}
        />
        <StepCard
          title="Scenario Classification"
          step={data.steps.classification}
          stepNumber={2}
          isExpanded={expandedSteps.has(2)}
          onToggle={() => toggleStep(2)}
        />
        <StepCard
          title="Entity Extraction (SOAP)"
          step={data.steps.extraction}
          stepNumber={3}
          isExpanded={expandedSteps.has(3)}
          onToggle={() => toggleStep(3)}
        />
        {data.steps.labs && (
          <StepCard
            title="Labs & Diagnostics Extraction"
            step={data.steps.labs}
            stepNumber={4}
            isExpanded={expandedSteps.has(4)}
            onToggle={() => toggleStep(4)}
          />
        )}
      </div>

      {/* Pipeline Trace */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setShowTrace(!showTrace)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="font-medium text-black">Pipeline Trace Log</span>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showTrace ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showTrace && (
          <div className="px-6 pb-6 border-t border-gray-100">
            <div className="mt-4 space-y-2">
              {data.pipelineTrace.map((trace, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-400 font-mono text-xs mt-0.5">{String(index + 1).padStart(2, "0")}</span>
                  <span className="text-gray-700">{trace}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Final Combined Result */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-black mb-4">Final Combined Result</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-96">
          {JSON.stringify(data.finalResult, null, 2)}
        </pre>
      </div>
    </div>
  );
}
