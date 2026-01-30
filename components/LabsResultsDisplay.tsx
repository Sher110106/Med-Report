"use client";

interface LabResult {
  test_name: string;
  value: string;
  unit: string;
  flag: string;
  original_text: string;
  confidence_score: number;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  confidence_score: number;
}

interface LabsData {
  patient_metadata: {
    name: string;
    age: string;
    gender: string;
    date_of_visit: string;
  };
  diagnostics_and_labs: LabResult[];
  clinical_assessment: {
    chief_complaint: string;
    symptoms: string[];
    diagnosis: string;
  };
  treatment_plan: {
    medications: Medication[];
    procedures_ordered: string[];
    lifestyle_advice: string;
  };
  metadata: {
    ocr_quality_check: string;
    extraction_notes: string;
  };
}

interface LabsResultsDisplayProps {
  data: LabsData;
  processingTime?: number;
}

function ConfidenceBadge({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 0.9) return "bg-green-100 text-green-800";
    if (score >= 0.7) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${getColor()}`}>
      {(score * 100).toFixed(0)}%
    </span>
  );
}

function FlagBadge({ flag }: { flag: string }) {
  const getColor = () => {
    switch (flag.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "critical":
        return "bg-red-200 text-red-900 border-red-300";
      case "normal":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <span className={`text-xs px-2 py-0.5 rounded border ${getColor()}`}>
      {flag}
    </span>
  );
}

export default function LabsResultsDisplay({ data, processingTime }: LabsResultsDisplayProps) {
  const handleDownload = () => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `labs-extraction-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Labs Extraction Results</h2>
        <div className="flex items-center gap-4">
          {processingTime && (
            <span className="text-sm text-gray-500">
              Processed in {(processingTime / 1000).toFixed(2)}s
            </span>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download JSON
          </button>
        </div>
      </div>

      {/* Patient Metadata */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-purple-700 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Patient Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase">Name</div>
            <div className="font-medium">{data.patient_metadata?.name ?? "Unknown"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Age</div>
            <div className="font-medium">{data.patient_metadata?.age ?? "Unknown"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Gender</div>
            <div className="font-medium">{data.patient_metadata?.gender ?? "Unknown"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Visit Date</div>
            <div className="font-medium">{data.patient_metadata?.date_of_visit ?? "Unknown"}</div>
          </div>
        </div>
      </div>

      {/* Clinical Assessment */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Clinical Assessment
        </h3>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Chief Complaint</div>
            <div className="bg-blue-50 p-3 rounded-lg text-blue-900">
              {data.clinical_assessment?.chief_complaint ?? "Not specified"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase mb-1">Diagnosis</div>
            <div className="bg-orange-50 p-3 rounded-lg text-orange-900 font-medium">
              {data.clinical_assessment?.diagnosis ?? "Not specified"}
            </div>
          </div>
          {(data.clinical_assessment?.symptoms?.length ?? 0) > 0 && (
            <div>
              <div className="text-xs text-gray-500 uppercase mb-1">Symptoms</div>
              <div className="flex flex-wrap gap-2">
                {data.clinical_assessment?.symptoms?.map((symptom, i) => (
                  <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                    {symptom}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Diagnostics & Labs */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Diagnostics & Labs
        </h3>
        {(data.diagnostics_and_labs?.length ?? 0) > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Test</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Value</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Unit</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Flag</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Confidence</th>
                </tr>
              </thead>
              <tbody>
                {data.diagnostics_and_labs?.map((lab, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <div className="font-medium">{lab.test_name}</div>
                      <div className="text-xs text-gray-400 italic">"{lab.original_text}"</div>
                    </td>
                    <td className="py-2 px-3 font-mono">{lab.value}</td>
                    <td className="py-2 px-3 text-gray-600">{lab.unit}</td>
                    <td className="py-2 px-3"><FlagBadge flag={lab.flag} /></td>
                    <td className="py-2 px-3"><ConfidenceBadge score={lab.confidence_score} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No lab results found</div>
        )}
      </div>

      {/* Treatment Plan */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Treatment Plan
        </h3>

        {/* Medications */}
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Medications</div>
          {(data.treatment_plan?.medications?.length ?? 0) > 0 ? (
            <div className="grid gap-3">
              {data.treatment_plan?.medications?.map((med, i) => (
                <div key={i} className="bg-red-50 p-3 rounded-lg flex justify-between items-start">
                  <div>
                    <div className="font-medium text-red-900">{med.name}</div>
                    <div className="text-sm text-red-700">
                      <span className="font-mono">{med.dosage}</span> • {med.frequency}
                    </div>
                  </div>
                  <ConfidenceBadge score={med.confidence_score} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm">No medications listed</div>
          )}
        </div>

        {/* Procedures Ordered */}
        {(data.treatment_plan?.procedures_ordered?.length ?? 0) > 0 && (
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Procedures Ordered</div>
            <div className="flex flex-wrap gap-2">
              {data.treatment_plan?.procedures_ordered?.map((proc, i) => (
                <span key={i} className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                  {proc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle Advice */}
        {data.treatment_plan?.lifestyle_advice && data.treatment_plan?.lifestyle_advice !== "Unknown" && (
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Lifestyle Advice</div>
            <div className="bg-green-50 p-3 rounded-lg text-green-900">
              {data.treatment_plan?.lifestyle_advice}
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm">
        <h3 className="font-medium text-gray-700 mb-2">Extraction Notes</h3>
        <div className="space-y-2 text-gray-600">
          <div>
            <span className="font-medium">OCR Quality:</span> {data.metadata?.ocr_quality_check ?? "Unknown"}
          </div>
          <div>
            <span className="font-medium">Notes:</span> {data.metadata?.extraction_notes ?? "None"}
          </div>
        </div>
      </div>

      {/* Raw JSON Output */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Raw JSON Output
          </h3>
          <button
            onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-xs font-mono bg-gray-50 p-4 rounded border overflow-auto max-h-[400px]">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
