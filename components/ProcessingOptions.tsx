"use client";

type ProcessingMode = "direct" | "two-stage" | "azure-two-stage" | "gemini-labs" | "azure-labs";

interface ProcessingOptionsProps {
  selectedMode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
  onProcess: () => void;
  isProcessing: boolean;
  disabled: boolean;
}

export default function ProcessingOptions({
  selectedMode,
  onModeChange,
  onProcess,
  isProcessing,
  disabled,
}: ProcessingOptionsProps) {
  return (
    <div className="w-full max-w-2xl space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Processing Mode</h3>

        <div className="space-y-3">
          {/* SOAP Extraction Options */}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            SOAP Note Extraction
          </div>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="direct"
              checked={selectedMode === "direct"}
              onChange={() => onModeChange("direct")}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Direct Processing (Fast)</div>
              <div className="text-sm text-gray-600">
                Image → Gemini Pro → SOAP JSON
                <br />
                <span className="text-xs text-gray-500">
                  Single-stage extraction with built-in OCR correction
                </span>
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="two-stage"
              checked={selectedMode === "two-stage"}
              onChange={() => onModeChange("two-stage")}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Two-Stage (Gemini)</div>
              <div className="text-sm text-gray-600">
                Image → Gemini Flash (OCR) → Gemini Pro → SOAP JSON
                <br />
                <span className="text-xs text-gray-500">
                  Raw OCR extraction followed by structured analysis
                </span>
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="azure-two-stage"
              checked={selectedMode === "azure-two-stage"}
              onChange={() => onModeChange("azure-two-stage")}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Two-Stage (Azure OpenAI)</div>
              <div className="text-sm text-gray-600">
                Image → Gemini Flash (OCR) → GPT-5-mini → SOAP JSON
                <br />
                <span className="text-xs text-gray-500">
                  Raw OCR extraction + Azure OpenAI for structured analysis
                </span>
              </div>
            </div>
          </label>

          {/* Labs Extraction Options */}
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-2 pt-3 border-t">
            Labs & Diagnostics Extraction
          </div>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="gemini-labs"
              checked={selectedMode === "gemini-labs"}
              onChange={() => onModeChange("gemini-labs")}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Labs Extraction (Gemini)</div>
              <div className="text-sm text-gray-600">
                Image → Gemini Flash (OCR) → Gemini Pro → Labs JSON
                <br />
                <span className="text-xs text-gray-500">
                  Focused on diagnostics, lab results, and medications
                </span>
              </div>
            </div>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="azure-labs"
              checked={selectedMode === "azure-labs"}
              onChange={() => onModeChange("azure-labs")}
              className="mt-1"
            />
            <div>
              <div className="font-medium">Labs Extraction (Azure OpenAI)</div>
              <div className="text-sm text-gray-600">
                Image → Gemini Flash (OCR) → GPT-5-mini → Labs JSON
                <br />
                <span className="text-xs text-gray-500">
                  Focused on diagnostics, lab results, and medications
                </span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <button
        onClick={onProcess}
        disabled={disabled || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? "Processing..." : "Extract Data"}
      </button>
    </div>
  );
}
