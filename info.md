# Next.js Medical Note Extractor - Module Breakdown

Here's a comprehensive module-wise breakdown for your medical SOAP note extraction app with both direct and two-stage processing options.

## 📁 Project Structure

```
medical-note-extractor/
├── app/
│   ├── api/
│   │   ├── extract-direct/
│   │   │   └── route.ts
│   │   ├── extract-ocr/
│   │   │   └── route.ts
│   │   └── extract-soap/
│   │       └── route.ts
│   ├── page.tsx
│   └── layout.tsx
├── components/
│   ├── ImageUploader.tsx
│   ├── ProcessingOptions.tsx
│   ├── ResultsDisplay.tsx
│   └── LoadingSpinner.tsx
├── lib/
│   ├── gemini.ts
│   ├── prompts.ts
│   └── types.ts
├── utils/
│   └── imageHelper.ts
└── .env.local
```

---

## 🔧 Module 1: Configuration & Types

### **File: `lib/types.ts`**
TypeScript interfaces for structured data

```typescript
export interface VitalsData {
  bp: string | null;
  hr: string | null;
  temp: string | null;
  rr: string | null;
  weight: string | null;
}

export interface PhysicalExam {
  findings: string[];
  text_raw: string;
}

export interface Diagnosis {
  value: string;
  certainty_degree: number;
  evidence_text: string;
}

export interface Medication {
  drug: string;
  dosage: string;
  sig: string;
  handwriting_confidence: number;
}

export interface SOAPNote {
  soap_note: {
    subjective: {
      chief_complaint: string;
      hpi: string;
      symptoms: string[];
      patient_history: string;
    };
    objective: {
      vitals: VitalsData;
      physical_exam: PhysicalExam;
      labs_imaging: string;
    };
    assessment: {
      primary_diagnosis: Diagnosis;
      differential_diagnosis: string[];
    };
    plan: {
      medications: Medication[];
      procedures_ordered: string[];
      patient_instructions: string;
    };
  };
  metadata: {
    ocr_quality_check: string;
    critical_ambiguities: string;
  };
}

export interface ProcessingResponse {
  success: boolean;
  data?: SOAPNote;
  rawText?: string;
  error?: string;
  processingTime?: number;
}
```

### **File: `.env.local`**
```env
GEMINI_API_KEY=your_api_key_here
```

---

## 🔧 Module 2: Gemini API Client

### **File: `lib/gemini.ts`**
Centralized Gemini API interaction

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const geminiModels = {
  pro: genAI.getGenerativeModel({ model: "gemini-1.5-pro" }),
  flash: genAI.getGenerativeModel({ model: "gemini-1.5-flash" }),
};

export async function callGeminiWithImage(
  model: "pro" | "flash",
  prompt: string,
  imageBase64: string,
  mimeType: string
) {
  const selectedModel = geminiModels[model];

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType,
    },
  };

  const result = await selectedModel.generateContent([prompt, imagePart]);
  const response = await result.response;
  return response.text();
}

export async function callGeminiWithText(
  model: "pro" | "flash",
  prompt: string,
  text: string
) {
  const selectedModel = geminiModels[model];
  const fullPrompt = `${prompt}\n\nINPUT TEXT:\n"""\n${text}\n"""`;
  
  const result = await selectedModel.generateContent(fullPrompt);
  const response = await result.response;
  return response.text();
}
```

---

## 🔧 Module 3: Prompt Templates

### **File: `lib/prompts.ts`**

```typescript
export const OCR_EXTRACTION_PROMPT = `### SYSTEM ROLE
You are an expert OCR (Optical Character Recognition) specialist focused on medical documents.

### INSTRUCTION
Your ONLY task is to transcribe the handwritten text from the medical note image exactly as it appears. 

**Critical Rules:**
1. **NO CORRECTIONS**: Do not fix spelling, grammar, or medical terminology errors
2. **NO INTERPRETATION**: Do not try to make sense of ambiguous text
3. **PRESERVE LAYOUT**: Maintain line breaks and spacing where possible
4. **CHARACTER-BY-CHARACTER**: If "l0mg" is written (with lowercase 'L'), write "l0mg" (don't correct to "10mg")
5. **UNCERTAIN TEXT**: If a word is completely illegible, write [ILLEGIBLE] in its place
6. **NO ASSUMPTIONS**: If you see "BP: 12O/8O" (with letter O), write exactly that

### OUTPUT FORMAT
Provide ONLY the raw transcribed text with no additional commentary, explanations, or JSON formatting.

Start the transcription on the next line:
---
`;

export const SOAP_EXTRACTION_PROMPT = `### SYSTEM ROLE
You are an expert Medical Scribe and Clinical Data Validator. You are processing a raw image of a handwritten doctor's note.

### INSTRUCTION
Your task is to execute a 2-Stage extraction process to convert the handwritten image into a structured SOAP JSON format.

**STAGE 1: OCR CORRECTION & CONTEXTUALIZATION (Mental Scratchpad)**
* First, internally transcribe the handwritten text.
* Apply "Contextual Correction": If a word is ambiguous (e.g., "l" vs "1"), use the medical context to correct it (e.g., if near "BP", "120/80" is likely; if near "mg", "1" is likely).
* **Do not output the raw transcript.** Use it only to populate the JSON in Stage 2.

**STAGE 2: SOAP STRUCTURED EXTRACTION**
Map the transcribed information into the following JSON Schema. Follow these specific constraints based on the "Spiral Prompting" methodology:
1. **Missing Data:** If a field (e.g., "Allergies") is not found in the text, return "null" or "Unknown". Do not hallucinate.
2. **Certainty Degree (CD):** For the "Assessment" (Diagnosis) and "Plan" (Rx), you must provide a confidence score (0.00 to 1.00) indicating how legible the handwriting was for that specific item.
3. **Evidence:** For every Diagnosis, quote the specific text fragment that supports it.

### TARGET SCHEMA (JSON)
Output ONLY this JSON object. Do not include markdown formatting or conversational text.

{
  "soap_note": {
    "subjective": {
      "chief_complaint": "<Primary reason for visit>",
      "hpi": "<History of Present Illness - narrative>",
      "symptoms": ["<List of reported symptoms>"],
      "patient_history": "<Relevant past medical history or Unknown>"
    },
    "objective": {
      "vitals": {
        "bp": "<Blood Pressure or null>",
        "hr": "<Heart Rate or null>",
        "temp": "<Temperature or null>",
        "rr": "<Respiratory Rate or null>",
        "weight": "<Weight or null>"
      },
      "physical_exam": {
        "findings": ["<List distinct physical exam observations>"],
        "text_raw": "<Full text of exam section>"
      },
      "labs_imaging": "<Any results mentioned or Pending>"
    },
    "assessment": {
      "primary_diagnosis": {
        "value": "<The main diagnosis>",
        "certainty_degree": 0.00,
        "evidence_text": "<Exact handwritten text snippet used>"
      },
      "differential_diagnosis": ["<List of other potential diagnoses>"]
    },
    "plan": {
      "medications": [
        {
          "drug": "<Name>",
          "dosage": "<Strength e.g. 500mg>",
          "sig": "<Instructions e.g. BID x 7 days>",
          "handwriting_confidence": 0.00
        }
      ],
      "procedures_ordered": ["<List of labs/referrals>"],
      "patient_instructions": "<Advice given to patient>"
    }
  },
  "metadata": {
    "ocr_quality_check": "<Comment on overall legibility>",
    "critical_ambiguities": "<List any text that was too messy to read safely>"
  }
}`;

export const SOAP_FROM_TEXT_PROMPT = `### SYSTEM ROLE
You are an expert Clinical Data Structuring Specialist. Your task is to parse raw, noisy OCR text from a general doctor's note and extract structured data into a precise JSON format.

### INSTRUCTIONS
Based on the clinical text provided in the "INPUT" section, extract the value, evidence, and certainty degree (CD: 0.00 to 1.00) for the attributes listed in the Schema below.

**1. OCR Correction & Inference:** The input is raw OCR text and may contain typos (e.g., "10mg" read as "l0mg"). You must infer the correct medical terms based on context. If a term is ambiguous, lower the Certainty Degree (CD).

**2. SOAP Structure:**
Extract the following fields. If a field is not mentioned, return "Unknown" or null.

**3. Output Requirements (Spiral Logic):**
For diagnosis and medications, you must provide:
- \`value\`: The cleaned, standardized value
- \`certainty_degree\`: A float between 0.00 and 1.00 indicating certainty
- \`evidence_text\`: The exact substring from the OCR text used as basis

**4. Handling Negation & Nuance:**
- Ensure valid inference. Do not extract "Diabetes" as a diagnosis if the text says "No history of Diabetes."
- If evidence is not explicitly present, return value as "Unknown".

**5. Final Output:**
Output ONLY the valid JSON object following this exact schema:

{
  "soap_note": {
    "subjective": {
      "chief_complaint": "<Primary reason for visit>",
      "hpi": "<History of Present Illness - narrative>",
      "symptoms": ["<List of reported symptoms>"],
      "patient_history": "<Relevant past medical history or Unknown>"
    },
    "objective": {
      "vitals": {
        "bp": "<Blood Pressure or null>",
        "hr": "<Heart Rate or null>",
        "temp": "<Temperature or null>",
        "rr": "<Respiratory Rate or null>",
        "weight": "<Weight or null>"
      },
      "physical_exam": {
        "findings": ["<List distinct physical exam observations>"],
        "text_raw": "<Full text of exam section>"
      },
      "labs_imaging": "<Any results mentioned or Pending>"
    },
    "assessment": {
      "primary_diagnosis": {
        "value": "<The main diagnosis>",
        "certainty_degree": 0.00,
        "evidence_text": "<Exact text snippet used>"
      },
      "differential_diagnosis": ["<List of other potential diagnoses>"]
    },
    "plan": {
      "medications": [
        {
          "drug": "<Name>",
          "dosage": "<Strength e.g. 500mg>",
          "sig": "<Instructions e.g. BID x 7 days>",
          "handwriting_confidence": 0.00
        }
      ],
      "procedures_ordered": ["<List of labs/referrals>"],
      "patient_instructions": "<Advice given to patient>"
    }
  },
  "metadata": {
    "ocr_quality_check": "<Comment on overall legibility>",
    "critical_ambiguities": "<List any text that was too messy to read safely>"
  }
}`;
```

---

## 🔧 Module 4: API Routes

### **File: `app/api/extract-direct/route.ts`**
Direct image → SOAP extraction with Gemini Pro

```typescript
import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithImage } from "@/lib/gemini";
import { SOAP_EXTRACTION_PROMPT } from "@/lib/prompts";
import { ProcessingResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Call Gemini Pro with image
    const rawResponse = await callGeminiWithImage(
      "pro",
      SOAP_EXTRACTION_PROMPT,
      base64Image,
      image.type
    );

    // Parse JSON response (strip markdown if present)
    const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                      rawResponse.match(/{[\s\S]*}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const soapData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const processingTime = Date.now() - startTime;

    const response: ProcessingResponse = {
      success: true,
      data: soapData,
      processingTime,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Direct extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Processing failed",
      },
      { status: 500 }
    );
  }
}
```

### **File: `app/api/extract-ocr/route.ts`**
Image → OCR text extraction with Gemini Flash

```typescript
import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithImage } from "@/lib/gemini";
import { OCR_EXTRACTION_PROMPT } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json(
        { success: false, error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Call Gemini Flash for OCR
    const rawText = await callGeminiWithImage(
      "flash",
      OCR_EXTRACTION_PROMPT,
      base64Image,
      image.type
    );

    // Clean the response
    const cleanedText = rawText
      .replace(/^---\n/, "")
      .replace(/\n---$/, "")
      .trim();

    return NextResponse.json({
      success: true,
      rawText: cleanedText,
    });
  } catch (error: any) {
    console.error("OCR extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "OCR processing failed",
      },
      { status: 500 }
    );
  }
}
```

### **File: `app/api/extract-soap/route.ts`**
OCR text → SOAP extraction with Gemini Pro

```typescript
import { NextRequest, NextResponse } from "next/server";
import { callGeminiWithText } from "@/lib/gemini";
import { SOAP_FROM_TEXT_PROMPT } from "@/lib/prompts";
import { ProcessingResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { ocrText } = await request.json();

    if (!ocrText) {
      return NextResponse.json(
        { success: false, error: "No OCR text provided" },
        { status: 400 }
      );
    }

    // Call Gemini Pro with text
    const rawResponse = await callGeminiWithText(
      "pro",
      SOAP_FROM_TEXT_PROMPT,
      ocrText
    );

    // Parse JSON response
    const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                      rawResponse.match(/{[\s\S]*}/);
    
    if (!jsonMatch) {
      throw new Error("Failed to extract JSON from response");
    }

    const soapData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
    const processingTime = Date.now() - startTime;

    const response: ProcessingResponse = {
      success: true,
      data: soapData,
      processingTime,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("SOAP extraction error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "SOAP processing failed",
      },
      { status: 500 }
    );
  }
}
```

---

## 🔧 Module 5: Frontend Components

### **File: `components/ImageUploader.tsx`**

```typescript
"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
}

export default function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      onImageSelect(file);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        {preview ? (
          <div className="relative w-full h-64">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
        ) : (
          <div>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              Click to upload medical note image
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG up to 10MB
            </p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
```

### **File: `components/ProcessingOptions.tsx`**

```typescript
"use client";

interface ProcessingOptionsProps {
  selectedMode: "direct" | "two-stage";
  onModeChange: (mode: "direct" | "two-stage") => void;
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
              <div className="font-medium">Two-Stage Processing (Accurate)</div>
              <div className="text-sm text-gray-600">
                Image → Gemini Flash (OCR) → Gemini Pro → SOAP JSON
                <br />
                <span className="text-xs text-gray-500">
                  Raw OCR extraction followed by structured analysis
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
        {isProcessing ? "Processing..." : "Extract SOAP Data"}
      </button>
    </div>
  );
}
```

### **File: `components/ResultsDisplay.tsx`**

```typescript
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
```

---

## 🔧 Module 6: Main Page

### **File: `app/page.tsx`**

```typescript
"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ProcessingOptions from "@/components/ProcessingOptions";
import ResultsDisplay from "@/components/ResultsDisplay";
import { SOAPNote } from "@/lib/types";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<"direct" | "two-stage">(
    "direct"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [soapData, setSOAPData] = useState<SOAPNote | undefined>();
  const [rawOCRText, setRawOCRText] = useState<string | undefined>();
  const [processingTime, setProcessingTime] = useState<number | undefined>();
  const [error, setError] = useState<string | undefined>();

  const handleDirectProcessing = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("image", selectedFile);

    const response = await fetch("/api/extract-direct", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      setSOAPData(result.data);
      setProcessingTime(result.processingTime);
    } else {
      throw new Error(result.error);
    }
  };

  const handleTwoStageProcessing = async () => {
    if (!selectedFile) return;

    // Stage 1: OCR extraction
    const formData = new FormData();
    formData.append("image", selectedFile);

    const ocrResponse = await fetch("/api/extract-ocr", {
      method: "POST",
      body: formData,
    });

    const ocrResult = await ocrResponse.json();
    if (!ocrResult.success) {
      throw new Error(ocrResult.error);
    }

    setRawOCRText(ocrResult.rawText);

    // Stage 2: SOAP extraction
    const soapResponse = await fetch("/api/extract-soap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ocrText: ocrResult.rawText }),
    });

    const soapResult = await soapResponse.json();
    if (soapResult.success) {
      setSOAPData(soapResult.data);
      setProcessingTime(soapResult.processingTime);
    } else {
      throw new Error(soapResult.error);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(undefined);
    setSOAPData(undefined);
    setRawOCRText(undefined);

    try {
      if (processingMode === "direct") {
        await handleDirectProcessing();
      } else {
        await handleTwoStageProcessing();
      }
    } catch (err: any) {
      setError(err.message || "Processing failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Medical SOAP Note Extractor
          </h1>
          <p className="text-gray-600">
            AI-powered extraction from handwritten doctor's notes
          </p>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <ImageUploader onImageSelect={setSelectedFile} />

          <ProcessingOptions
            selectedMode={processingMode}
            onModeChange={setProcessingMode}
            onProcess={handleProcess}
            isProcessing={isProcessing}
            disabled={!selectedFile}
          />

          {error && (
            <div className="w-full max-w-2xl bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}

          {isProcessing && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">
                {processingMode === "two-stage"
                  ? "Stage 1: Extracting OCR text..."
                  : "Processing image..."}
              </p>
            </div>
          )}

          <ResultsDisplay
            soapData={soapData}
            rawText={rawOCRText}
            processingTime={processingTime}
            showRawText={processingMode === "two-stage"}
          />
        </div>
      </div>
    </main>
  );
}
```

---

## 📦 Installation & Setup

```bash
# 1. Create Next.js project
npx create-next-app@latest medical-note-extractor
# Choose: TypeScript, Tailwind, App Router

# 2. Install dependencies
cd medical-note-extractor
npm install @google/generative-ai

# 3. Add .env.local
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 4. Run development server
npm run dev
```

---

## 🎯 Summary of Workflows

| **Mode** | **Flow** | **Speed** | **Accuracy** | **Use Case** |
|----------|----------|-----------|--------------|--------------|
| **Direct** | Image → Gemini Pro → JSON | ~5-8s | High | Clean handwriting, fast processing |
| **Two-Stage** | Image → Gemini Flash (OCR) → Gemini Pro → JSON | ~8-12s | Highest | Poor handwriting, debugging OCR |

This architecture gives you full control over both processing strategies while maintaining clean separation of concerns!
