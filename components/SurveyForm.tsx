"use client";

import { useState } from "react";

// Types for survey responses
export interface ModelResponse {
  a1_overall_fidelity: number;
  a2_subjective: number;
  a2_objective: number;
  a2_assessment: number;
  a2_plan: number;
  b1_hallucination: boolean;
  b2_critical_omission: boolean;
  b3_numerical_errors: boolean;
  c1_edit_effort: "increases_workload" | "neutral" | "saves_time";
  c2_trust_threshold: boolean;
  d_feedback: string;
}

interface SurveyFormProps {
  modelName: string;
  modelOutput: Record<string, unknown> | null;
  onSubmit: (response: ModelResponse) => void;
  isSubmitting?: boolean;
}

// Likert scale labels
const LIKERT_LABELS: Record<number, string> = {
  1: "Unusable",
  2: "Poor",
  3: "Acceptable",
  4: "Very Good",
  5: "Perfect",
};

const LIKERT_DESCRIPTIONS: Record<number, string> = {
  1: "Major hallucinations or misunderstandings",
  2: "Multiple important errors",
  3: "Core info present, needs edits",
  4: "Minor edits only",
  5: "Equivalent to expert documentation",
};

export default function SurveyForm({
  modelName,
  modelOutput,
  onSubmit,
  isSubmitting = false,
}: SurveyFormProps) {
  const [formData, setFormData] = useState<ModelResponse>({
    a1_overall_fidelity: 3,
    a2_subjective: 3,
    a2_objective: 3,
    a2_assessment: 3,
    a2_plan: 3,
    b1_hallucination: false,
    b2_critical_omission: false,
    b3_numerical_errors: false,
    c1_edit_effort: "neutral",
    c2_trust_threshold: false,
    d_feedback: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const output = modelOutput as Record<string, unknown> | null;
  const soapNote = output?.output && (output.output as Record<string, unknown>)?.soap_note as Record<string, unknown> | undefined;

  // Format SOAP section nicely
  const formatSoapSection = (section: unknown): React.ReactNode => {
    if (!section) return <span className="text-gray-400 italic">Not available</span>;
    
    if (typeof section === 'string') {
      return <p className="text-gray-700">{section}</p>;
    }
    
    if (typeof section === 'object' && section !== null) {
      const obj = section as Record<string, unknown>;
      return (
        <div className="space-y-2">
          {Object.entries(obj).map(([key, value]) => {
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            if (value === null || value === undefined || value === '') return null;
            
            if (Array.isArray(value)) {
              if (value.length === 0) return null;
              return (
                <div key={key}>
                  <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
                  <ul className="list-disc list-inside text-gray-700 text-sm mt-1">
                    {value.map((item, idx) => (
                      <li key={idx}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
                    ))}
                  </ul>
                </div>
              );
            }
            
            if (typeof value === 'object') {
              return (
                <div key={key}>
                  <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
                  <div className="text-gray-700 text-sm mt-1 pl-2 border-l-2 border-gray-200">
                    {formatSoapSection(value)}
                  </div>
                </div>
              );
            }
            
            return (
              <div key={key}>
                <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
                <p className="text-gray-700 text-sm">{String(value)}</p>
              </div>
            );
          })}
        </div>
      );
    }
    
    return <p className="text-gray-700">{String(section)}</p>;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Model Output Display */}
      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-black mb-4 flex items-center gap-2">
          <span className="px-3 py-1 bg-black text-white rounded-full text-sm font-medium">
            {modelName}
          </span>
          SOAP Output
        </h3>
        
        {soapNote ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Subjective */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 max-h-64 overflow-y-auto">
              <h4 className="font-semibold text-black mb-3 flex items-center gap-2 sticky top-0 bg-white">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">S</span>
                Subjective
              </h4>
              <div className="text-sm break-words">{formatSoapSection(soapNote.subjective)}</div>
            </div>
            
            {/* Objective */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 max-h-64 overflow-y-auto">
              <h4 className="font-semibold text-black mb-3 flex items-center gap-2 sticky top-0 bg-white">
                <span className="w-6 h-6 bg-green-100 text-green-600 rounded-lg flex items-center justify-center text-xs font-bold">O</span>
                Objective
              </h4>
              <div className="text-sm break-words">{formatSoapSection(soapNote.objective)}</div>
            </div>
            
            {/* Assessment */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 max-h-64 overflow-y-auto">
              <h4 className="font-semibold text-black mb-3 flex items-center gap-2 sticky top-0 bg-white">
                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-xs font-bold">A</span>
                Assessment
              </h4>
              <div className="text-sm break-words">{formatSoapSection(soapNote.assessment)}</div>
            </div>
            
            {/* Plan */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 max-h-64 overflow-y-auto">
              <h4 className="font-semibold text-black mb-3 flex items-center gap-2 sticky top-0 bg-white">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xs font-bold">P</span>
                Plan
              </h4>
              <div className="text-sm break-words">{formatSoapSection(soapNote.plan)}</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-400 italic">No output available for this model</p>
        )}
      </div>

      {/* Section A: Core Quality Ratings */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">A</span>
          Core Quality Ratings
        </h3>

        {/* A1: Overall Fidelity */}
        <div className="mb-8">
          <label className="block text-black font-medium mb-3">
            A1. How accurately does this output reflect the handwritten note?
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setFormData({ ...formData, a1_overall_fidelity: value })}
                className={`p-3 rounded-xl border-2 transition-all text-center ${
                  formData.a1_overall_fidelity === value
                    ? "border-black bg-black text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                }`}
              >
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs mt-1 leading-tight">{LIKERT_LABELS[value]}</div>
              </button>
            ))}
          </div>
          <p className="text-gray-500 text-sm mt-2">
            {LIKERT_DESCRIPTIONS[formData.a1_overall_fidelity]}
          </p>
        </div>

        {/* A2: Section-Wise Accuracy */}
        <div>
          <label className="block text-black font-medium mb-3">
            A2. Section-Wise Accuracy (rate each SOAP section)
          </label>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: "a2_subjective", label: "Subjective", color: "blue" },
              { key: "a2_objective", label: "Objective", color: "green" },
              { key: "a2_assessment", label: "Assessment", color: "orange" },
              { key: "a2_plan", label: "Plan", color: "purple" },
            ].map(({ key, label, color }) => (
              <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className={`text-${color}-600 text-sm font-medium mb-2`} style={{ color: color === 'blue' ? '#2563eb' : color === 'green' ? '#16a34a' : color === 'orange' ? '#ea580c' : '#9333ea' }}>
                  {label}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, [key]: value })}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                        formData[key as keyof ModelResponse] === value
                          ? "bg-black text-white"
                          : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section B: Safety Evaluation */}
      <div className="bg-white rounded-2xl p-6 border-2 border-red-100">
        <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">B</span>
          Clinical Safety Evaluation
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* B1: Hallucination */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="block text-black font-medium mb-2 text-sm">
              B1. Did the model add information NOT present?
            </label>
            <p className="text-gray-400 text-xs mb-3">(invented diagnoses, medications, vitals)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, b1_hallucination: true })}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  formData.b1_hallucination
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, b1_hallucination: false })}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  !formData.b1_hallucination
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* B2: Critical Omission */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="block text-black font-medium mb-2 text-sm">
              B2. Did the model MISS important information?
            </label>
            <p className="text-gray-400 text-xs mb-3">(chest pain, allergies, negations)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, b2_critical_omission: true })}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  formData.b2_critical_omission
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, b2_critical_omission: false })}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  !formData.b2_critical_omission
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* B3: Numerical Errors */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <label className="block text-black font-medium mb-2 text-sm">
              B3. Were there any numerical/unit errors?
            </label>
            <p className="text-gray-400 text-xs mb-3">(BP reversed, wrong dosage)</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, b3_numerical_errors: true })}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  formData.b3_numerical_errors
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, b3_numerical_errors: false })}
                className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
                  !formData.b3_numerical_errors
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-gray-400"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section C: Clinical Usability */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
          <span className="w-8 h-8 bg-orange-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">C</span>
          Clinical Usability
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* C1: Edit Effort */}
          <div>
            <label className="block text-black font-medium mb-3">
              C1. How would this affect your workload?
            </label>
            <div className="space-y-2">
              {[
                { value: "increases_workload", label: "Increases workload", desc: "More editing than writing", color: "red" },
                { value: "neutral", label: "Neutral", desc: "About the same effort", color: "gray" },
                { value: "saves_time", label: "Saves time", desc: "Significant time savings", color: "green" },
              ].map(({ value, label, desc, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, c1_edit_effort: value as ModelResponse["c1_edit_effort"] })}
                  className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                    formData.c1_edit_effort === value
                      ? color === "red"
                        ? "border-red-500 bg-red-50"
                        : color === "green"
                        ? "border-green-500 bg-green-50"
                        : "border-black bg-gray-50"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="font-medium text-black">{label}</div>
                  <div className="text-gray-500 text-sm">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* C2: Trust Threshold */}
          <div>
            <label className="block text-black font-medium mb-3">
              C2. Would you sign this note after minimal review?
            </label>
            <p className="text-gray-500 text-sm mb-4">(Proxy for medico-legal acceptability)</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, c2_trust_threshold: true })}
                className={`flex-1 py-4 rounded-xl font-medium text-lg transition-all ${
                  formData.c2_trust_threshold
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                ✓ Yes
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, c2_trust_threshold: false })}
                className={`flex-1 py-4 rounded-xl font-medium text-lg transition-all ${
                  !formData.c2_trust_threshold
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                ✗ No
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section D: Qualitative Feedback */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
        <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
          <span className="w-8 h-8 bg-purple-500 text-white rounded-lg flex items-center justify-center text-sm font-bold">D</span>
          Qualitative Feedback
          <span className="text-gray-400 text-sm font-normal">(Optional)</span>
        </h3>
        <textarea
          value={formData.d_feedback}
          onChange={(e) => setFormData({ ...formData, d_feedback: e.target.value })}
          placeholder="If you noticed errors or strengths, please specify briefly (2-3 sentences max)..."
          className="w-full h-24 bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
          isSubmitting
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-black text-white hover:bg-gray-800 shadow-lg hover:shadow-xl"
        }`}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Submitting...
          </span>
        ) : (
          "Submit Rating & Continue →"
        )}
      </button>
    </form>
  );
}
