"use client";

import { SOAPNote } from "@/lib/types";

interface ResultsDisplayProps {
  soapData?: SOAPNote;
  rawText?: string;
  processingTime?: number;
  showRawText?: boolean;
}

export default function ResultsDisplay({
  soapData,
  rawText,
  processingTime,
  showRawText,
}: ResultsDisplayProps) {
  if (!soapData && !rawText) return null;

  return (
    <div className="w-full max-w-4xl space-y-4">
      {processingTime && (
        <div className="text-sm text-gray-600 text-right">
          Processing time: {(processingTime / 1000).toFixed(2)}s
        </div>
      )}

      {showRawText && rawText && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Raw OCR Text</h3>
          <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border">
            {rawText}
          </pre>
        </div>
      )}

      {soapData && (
        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          <h2 className="text-2xl font-bold">SOAP Note</h2>

          {/* Subjective */}
          <section>
            <h3 className="text-xl font-semibold text-blue-600 mb-2">
              Subjective
            </h3>
            <div className="space-y-2 pl-4">
              <div>
                <span className="font-medium">Chief Complaint:</span>{" "}
                {soapData.soap_note.subjective.chief_complaint}
              </div>
              <div>
                <span className="font-medium">HPI:</span>{" "}
                {soapData.soap_note.subjective.hpi}
              </div>
              {soapData.soap_note.subjective.symptoms.length > 0 && (
                <div>
                  <span className="font-medium">Symptoms:</span>
                  <ul className="list-disc list-inside ml-4">
                    {soapData.soap_note.subjective.symptoms.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Objective */}
          <section>
            <h3 className="text-xl font-semibold text-green-600 mb-2">
              Objective
            </h3>
            <div className="space-y-3 pl-4">
              <div>
                <span className="font-medium">Vitals:</span>
                <div className="grid grid-cols-2 gap-2 ml-4 mt-1">
                  {Object.entries(soapData.soap_note.objective.vitals).map(
                    ([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="uppercase text-gray-600">{key}:</span>{" "}
                        {value || "N/A"}
                      </div>
                    )
                  )}
                </div>
              </div>
              {soapData.soap_note.objective.physical_exam.findings.length >
                0 && (
                <div>
                  <span className="font-medium">Physical Exam:</span>
                  <ul className="list-disc list-inside ml-4">
                    {soapData.soap_note.objective.physical_exam.findings.map(
                      (f, i) => (
                        <li key={i}>{f}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Assessment */}
          <section>
            <h3 className="text-xl font-semibold text-orange-600 mb-2">
              Assessment
            </h3>
            <div className="space-y-2 pl-4">
              <div className="bg-orange-50 p-3 rounded">
                <div className="font-medium">
                  {soapData.soap_note.assessment.primary_diagnosis.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Confidence:{" "}
                  {(
                    soapData.soap_note.assessment.primary_diagnosis
                      .certainty_degree * 100
                  ).toFixed(0)}
                  %
                </div>
                <div className="text-xs text-gray-500 mt-1 italic">
                  Evidence: "
                  {soapData.soap_note.assessment.primary_diagnosis.evidence_text}
                  "
                </div>
              </div>
            </div>
          </section>

          {/* Plan */}
          <section>
            <h3 className="text-xl font-semibold text-purple-600 mb-2">Plan</h3>
            <div className="space-y-3 pl-4">
              {soapData.soap_note.plan.medications.length > 0 && (
                <div>
                  <span className="font-medium">Medications:</span>
                  <div className="space-y-2 ml-4 mt-2">
                    {soapData.soap_note.plan.medications.map((med, i) => (
                      <div key={i} className="bg-purple-50 p-3 rounded">
                        <div className="font-medium">
                          {med.drug} {med.dosage}
                        </div>
                        <div className="text-sm">{med.sig}</div>
                        <div className="text-xs text-gray-500">
                          Confidence: {(med.handwriting_confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {soapData.soap_note.plan.patient_instructions && (
                <div>
                  <span className="font-medium">Instructions:</span>{" "}
                  {soapData.soap_note.plan.patient_instructions}
                </div>
              )}
            </div>
          </section>

          {/* Metadata */}
          <section className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Quality Metadata
            </h3>
            <div className="text-sm space-y-1 pl-4">
              <div>
                <span className="font-medium">OCR Quality:</span>{" "}
                {soapData.metadata.ocr_quality_check}
              </div>
              {soapData.metadata.critical_ambiguities && (
                <div className="text-red-600">
                  <span className="font-medium">⚠️ Ambiguities:</span>{" "}
                  {soapData.metadata.critical_ambiguities}
                </div>
              )}
            </div>
          </section>

          {/* Download JSON */}
          <button
            onClick={() => {
              const blob = new Blob([JSON.stringify(soapData, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "soap-note.json";
              a.click();
            }}
            className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Download JSON
          </button>
        </div>
      )}
    </div>
  );
}
