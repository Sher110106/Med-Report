"use client";

import { useState } from "react";

interface ModelResult {
  modelName: string;
  modelId: string;
  success: boolean;
  output?: any;
  error?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  confidenceScore?: number;
}

interface ComparatorData {
  runId: string;
  results: ModelResult[];
  totalTime: number;
  modelsRun: number;
  modelsSucceeded: number;
}

interface ComparatorResultsProps {
  data: ComparatorData;
}

export default function ComparatorResults({ data }: ComparatorResultsProps) {
  const [expandedModel, setExpandedModel] = useState<string | null>(null);

  const getStatusColor = (result: ModelResult) => {
    if (result.error === "Coming Soon") return "bg-gray-100 border-gray-300";
    if (!result.success) return "bg-red-50 border-red-200";
    return "bg-green-50 border-green-200";
  };

  const getStatusBadge = (result: ModelResult) => {
    if (result.error === "Coming Soon") {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-600">
          Coming Soon
        </span>
      );
    }
    if (!result.success) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
          Failed
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
        Success
      </span>
    );
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="w-full max-w-7xl">
      {/* Summary Bar */}
      <div className="bg-black text-white rounded-t-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Comparison Results</h3>
          <p className="text-sm text-gray-400">Run ID: {data.runId}</p>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-2xl font-bold">{data.modelsSucceeded}</div>
            <div className="text-xs text-gray-400">Succeeded</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.modelsRun - data.modelsSucceeded}</div>
            <div className="text-xs text-gray-400">Failed/Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{(data.totalTime / 1000).toFixed(1)}s</div>
            <div className="text-xs text-gray-400">Total Time</div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="bg-gray-50 rounded-b-2xl p-6 border border-t-0 border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.results.map((result) => (
            <div
              key={result.modelId}
              className={`rounded-xl border-2 overflow-hidden transition-all duration-300 ${getStatusColor(
                result
              )} ${
                expandedModel === result.modelId ? "col-span-1 md:col-span-2 lg:col-span-3" : ""
              }`}
            >
              {/* Card Header */}
              <div
                className="p-4 cursor-pointer hover:bg-white/50 transition-colors"
                onClick={() =>
                  setExpandedModel(expandedModel === result.modelId ? null : result.modelId)
                }
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{result.modelName}</h4>
                    <p className="text-xs text-gray-500 mt-1">{result.modelId}</p>
                  </div>
                  {getStatusBadge(result)}
                </div>

                {result.success && (
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                    {result.latencyMs && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {(result.latencyMs / 1000).toFixed(1)}s
                      </span>
                    )}
                    {result.confidenceScore !== undefined && (
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {(result.confidenceScore * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}

                {result.error && result.error !== "Coming Soon" && (
                  <p className="text-sm text-red-600 mt-2">{result.error}</p>
                )}

                {result.error === "Coming Soon" && (
                  <p className="text-sm text-gray-500 mt-2 italic">
                    This model is not yet configured
                  </p>
                )}
              </div>

              {/* Expanded Content */}
              {expandedModel === result.modelId && result.success && result.output && (
                <div className="border-t border-gray-200 p-4 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-sm text-gray-700">Model Output</h5>
                    {result.inputTokens && result.outputTokens && (
                      <span className="text-xs text-gray-500">
                        {result.inputTokens} in / {result.outputTokens} out tokens
                      </span>
                    )}
                  </div>
                  <pre className="text-xs font-mono bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {formatJson(result.output)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
