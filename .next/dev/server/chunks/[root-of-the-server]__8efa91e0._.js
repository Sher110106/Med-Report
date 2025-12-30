module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/project/Med/lib/azure-openai.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "callAzureOpenAI",
    ()=>callAzureOpenAI
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$node_modules$2f$openai$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/project/Med/node_modules/openai/index.mjs [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$node_modules$2f$openai$2f$azure$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/project/Med/node_modules/openai/azure.mjs [app-route] (ecmascript)");
;
const endpoint = "https://ai-sherpartap11019601ai587562462851.openai.azure.com/";
const deployment = "gpt-5-mini";
const apiVersion = "2024-12-01-preview";
const client = new __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$node_modules$2f$openai$2f$azure$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AzureOpenAI"]({
    apiKey: process.env.AZURE_KEY,
    endpoint: endpoint,
    apiVersion: apiVersion
});
async function callAzureOpenAI(systemPrompt, userContent) {
    const response = await client.chat.completions.create({
        model: deployment,
        max_completion_tokens: 16384,
        messages: [
            {
                role: "system",
                content: systemPrompt
            },
            {
                role: "user",
                content: userContent
            }
        ]
    });
    return response.choices[0].message.content || "";
}
}),
"[project]/project/Med/lib/prompts.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LABS_EXTRACTION_PROMPT",
    ()=>LABS_EXTRACTION_PROMPT,
    "OCR_EXTRACTION_PROMPT",
    ()=>OCR_EXTRACTION_PROMPT,
    "SOAP_EXTRACTION_PROMPT",
    ()=>SOAP_EXTRACTION_PROMPT,
    "SOAP_FROM_TEXT_PROMPT",
    ()=>SOAP_FROM_TEXT_PROMPT
]);
const OCR_EXTRACTION_PROMPT = `### SYSTEM ROLE
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
const SOAP_EXTRACTION_PROMPT = `### SYSTEM ROLE
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
const SOAP_FROM_TEXT_PROMPT = `### SYSTEM ROLE
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
const LABS_EXTRACTION_PROMPT = `### ROLE
You are an expert Clinical Data Structuring Specialist. Your task is to parse raw, noisy OCR text from a doctor's note and extract structured data into a precise JSON format.

### INSTRUCTIONS
Based on the clinical text provided in the "INPUT" section, extract the value, evidence, and certainty degree (CD) for the attributes listed below.

**CRITICAL RULE: MISSING NO DATA**
You must capture ALL quantifiable test results (Bloodwork, Urine, Imaging). Do not summarize them; extract them individually.

**1. OCR Correction & Inference:**
The input is raw OCR text. Correct obvious typos (e.g., "S6PT" -> "SGPT", "1O0 mg" -> "100 mg") based on medical context.

**2. Target Schema (JSON Structure):**

A. **patient_metadata**:
   - name, age, gender, date_of_visit (YYYY-MM-DD).

B. **diagnostics_and_labs** (CRITICAL SECTION):
   - Extract every single lab test or diagnostic measure found (e.g., SGPT, Hgb, TSH, X-Ray findings).
   - For each item, create an object with:
     - test_name: Standardized name (e.g., "ALT/SGPT").
     - value: The numeric or qualitative result (e.g., "45", "Negative").
     - unit: The unit of measurement (e.g., "IU/L", "mg/dL"). If missing, output "Unknown".
     - flag: Any indicator of abnormality (e.g., "High", "Low", "Critical", or "Normal").
     - original_text: The exact text snippet from the OCR.

C. **clinical_assessment**:
   - chief_complaint: Reason for visit.
   - symptoms: List of subjective symptoms reported.
   - diagnosis: Confirmed or suspected conditions.

D. **treatment_plan**:
   - medications: List of drugs (Name, Dosage, Frequency).
   - procedures_ordered: Specific tests or procedures ordered for the future.
   - lifestyle_advice: Diet/exercise instructions.

**3. Output Requirements:**
For diagnostics_and_labs and medications, return a LIST of objects.
For all extracted values, include a confidence_score (0.00-1.00).

Output ONLY the valid JSON object following this schema:
{
  "patient_metadata": {
    "name": "<Patient name or Unknown>",
    "age": "<Age or Unknown>",
    "gender": "<Gender or Unknown>",
    "date_of_visit": "<YYYY-MM-DD or Unknown>"
  },
  "diagnostics_and_labs": [
    {
      "test_name": "<Standardized test name>",
      "value": "<Result value>",
      "unit": "<Unit or Unknown>",
      "flag": "<High/Low/Critical/Normal>",
      "original_text": "<Exact OCR snippet>",
      "confidence_score": 0.00
    }
  ],
  "clinical_assessment": {
    "chief_complaint": "<Reason for visit>",
    "symptoms": ["<List of symptoms>"],
    "diagnosis": "<Diagnosis or Unknown>"
  },
  "treatment_plan": {
    "medications": [
      {
        "name": "<Drug name>",
        "dosage": "<Dosage>",
        "frequency": "<Frequency>",
        "confidence_score": 0.00
      }
    ],
    "procedures_ordered": ["<List of procedures/tests ordered>"],
    "lifestyle_advice": "<Diet/exercise instructions or Unknown>"
  },
  "metadata": {
    "ocr_quality_check": "<Comment on overall legibility>",
    "extraction_notes": "<Any important notes about the extraction>"
  }
}`;
}),
"[project]/project/Med/app/api/extract-labs-azure/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/project/Med/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$lib$2f$azure$2d$openai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/project/Med/lib/azure-openai.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$lib$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/project/Med/lib/prompts.ts [app-route] (ecmascript)");
;
;
;
async function POST(request) {
    const startTime = Date.now();
    try {
        const { ocrText } = await request.json();
        if (!ocrText) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                success: false,
                error: "No OCR text provided"
            }, {
                status: 400
            });
        }
        // Call Azure OpenAI GPT-5-mini with text for labs extraction
        const rawResponse = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$lib$2f$azure$2d$openai$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["callAzureOpenAI"])(__TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$lib$2f$prompts$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["LABS_EXTRACTION_PROMPT"], `INPUT TEXT:\n"""\n${ocrText}\n"""`);
        // Parse JSON response
        const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) || rawResponse.match(/{[\s\S]*}/);
        if (!jsonMatch) {
            throw new Error("Failed to extract JSON from response");
        }
        const labsData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        const processingTime = Date.now() - startTime;
        return __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: true,
            data: labsData,
            processingTime
        });
    } catch (error) {
        console.error("Labs Azure extraction error:", error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$project$2f$Med$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            success: false,
            error: error.message || "Labs processing failed"
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8efa91e0._.js.map