Below is a **clean, consistent revision of all 4 prompts**, modified so that **every step explicitly outputs a confidence score**, while still respecting the **Spiral Prompt Engineering + ChatSchema + DAG** methodology you described.

Key design principles I followed (aligned with prior research):

* **Confidence ≠ certainty of correctness**, but *model confidence given OCR quality and evidence*
* Confidence is **localized per step**, not global
* Confidence is **always justified implicitly by constraints**, not free-form explanation
* No step leaks reasoning that would contaminate downstream stages

---

# ✅ STEP 1 — HANDWRITTEN OCR

**(Pure transcription + OCR confidence)**

### What the confidence means here

👉 *How legible the handwriting was overall*, **not** semantic correctness.

```ts
export const OCR_EXTRACTION_PROMPT = `
### SYSTEM ROLE
You are an expert OCR (Optical Character Recognition) engine specialized in handwritten medical documents.

### TASK
Transcribe the handwritten medical note image EXACTLY as it appears.

### STRICT RULES (DO NOT VIOLATE)
1. NO CORRECTIONS — Do not fix spelling, grammar, or medical terminology
2. NO INTERPRETATION — Do not guess meaning
3. PRESERVE LINE BREAKS — Maintain original layout as much as possible
4. CHARACTER-BY-CHARACTER —
   - "l0mg" must remain "l0mg"
   - "12O/8O" must remain "12O/8O"
5. ILLEGIBLE TEXT —
   - If unreadable, write [ILLEGIBLE]
6. NO MEDICAL REASONING

### OUTPUT FORMAT (JSON ONLY)
{
  "raw_text": "<verbatim transcription>",
  "ocr_confidence": 0.00
}

### CONFIDENCE GUIDELINE
- 0.90–1.00 → Clear handwriting, minimal ambiguity
- 0.60–0.89 → Readable but inconsistent
- <0.60 → Significant ambiguity or illegible regions
`;
```

---

# ✅ STEP 2 — OCR PRE-CORRECTION + SCENARIO CLASSIFICATION

**(Routing confidence)**

### What the confidence means here

👉 *How confident the model is that the document belongs to the selected scenario.*

```ts
export const SCENARIO_CLASSIFICATION_PROMPT = `
### SYSTEM ROLE
You are a Clinical OCR Pre-Processing and Report Classification Agent.

### TASK
Given RAW OCR TEXT:
1. Internally correct OCR noise using medical context
2. Classify the document into ONE scenario
3. Output classification confidence

### STEP 1 — OCR PRE-CORRECTION (INTERNAL ONLY)
- Fix visually similar character errors (e.g., "S6PT" → "SGPT")
- Normalize spacing and line breaks
- DO NOT output corrected text

### STEP 2 — SCENARIO CLASSIFICATION
Choose ONE:

Allowed Values:
- "SOAP_NOTE"
- "LAB_REPORT"
- "PRESCRIPTION_ONLY"
- "DISCHARGE_SUMMARY"
- "UNKNOWN"

### DECISION RULES
- SOAP_NOTE → subjective + objective + plan
- LAB_REPORT → multiple numeric lab values
- PRESCRIPTION_ONLY → meds without vitals or assessment
- UNKNOWN → ambiguous or mixed

### OUTPUT FORMAT (JSON ONLY)
{
  "scenario": "<ONE_ALLOWED_VALUE>",
  "classification_confidence": 0.00
}

### CONFIDENCE GUIDELINE
- High confidence if multiple defining signals present
- Lower confidence if decision relied on weak or partial cues

### INPUT
{{RAW_OCR_TEXT}}
`;
```

---

# ✅ STEP 3 — ENTITY EXTRACTION (SOAP)

**(Per-entity certainty + overall extraction confidence)**

### What the confidence means here

* **Per-field certainty** → evidence strength + legibility
* **Overall confidence** → trustworthiness of the structured output

```ts
export const SOAP_ENTITY_EXTRACTION_PROMPT = `
### SYSTEM ROLE
You are an expert Medical Information Extraction Agent.

### INPUT
You are given cleaned OCR text classified as a SOAP NOTE.

### CORE RULES (SPIRAL PROMPTING)
1. DO NOT HALLUCINATE
2. If evidence is missing → value = "Unknown"
3. Evidence must be quoted verbatim
4. Certainty must reflect handwriting clarity + evidence strength

### NEGATION & NUANCE
- "No history of X" ≠ X
- "Rule out X" ≠ confirmed X

### OUTPUT FORMAT (JSON ONLY)
{
  "soap_note": {
    "subjective": {
      "chief_complaint": "<string or Unknown>",
      "hpi": "<string or Unknown>",
      "symptoms": ["<string>"],
      "patient_history": "<string or Unknown>"
    },
    "objective": {
      "vitals": {
        "bp": "<value or null>",
        "hr": "<value or null>",
        "temp": "<value or null>",
        "rr": "<value or null>",
        "weight": "<value or null>"
      },
      "physical_exam": {
        "findings": ["<string>"],
        "text_raw": "<verbatim text or Unknown>"
      },
      "labs_imaging": "<string or Pending>"
    },
    "assessment": {
      "primary_diagnosis": {
        "value": "<diagnosis or Unknown>",
        "certainty_degree": 0.00,
        "evidence_text": "<exact quote>"
      },
      "differential_diagnosis": ["<string>"]
    },
    "plan": {
      "medications": [
        {
          "drug": "<name>",
          "dosage": "<dose>",
          "sig": "<instructions>",
          "handwriting_confidence": 0.00
        }
      ],
      "procedures_ordered": ["<string>"],
      "patient_instructions": "<string or Unknown>"
    }
  },
  "metadata": {
    "overall_extraction_confidence": 0.00,
    "ocr_quality_comment": "<brief>",
    "critical_ambiguities": ["<string>"]
  }
}

### CONFIDENCE GUIDELINES
- High (≥0.85): clear handwriting + explicit evidence
- Medium (0.60–0.84): partial clarity or inferred structure
- Low (<0.60): weak evidence or poor legibility

### INPUT TEXT
{{CLEANED_OCR_TEXT}}
`;
```

---

# ✅ STEP 4 — LABS & RELATION EXTRACTION

**(Per-test confidence + aggregate confidence)**

### What the confidence means here

👉 *Confidence that the test name, value, and unit were correctly identified and normalized.*

```ts
export const LABS_RELATION_EXTRACTION_PROMPT = `
### SYSTEM ROLE
You are a Clinical Diagnostics Structuring Agent.

### TASK
Extract ALL laboratory and diagnostic results individually.
Do NOT summarize or merge.

### OCR NORMALIZATION RULES
- Correct OCR noise using medical context
- Normalize test names (e.g., SGPT → ALT/SGPT)
- Normalize units when possible

### OUTPUT FORMAT (JSON ONLY)
{
  "diagnostics_and_labs": [
    {
      "test_name": "<standardized name>",
      "value": "<numeric or qualitative>",
      "unit": "<unit or Unknown>",
      "flag": "<High | Low | Normal | Critical | Unknown>",
      "original_text": "<exact OCR snippet>",
      "confidence_score": 0.00
    }
  ],
  "metadata": {
    "overall_labs_confidence": 0.00,
    "ocr_quality_check": "<brief>",
    "extraction_notes": "<notes>"
  }
}

### CONFIDENCE GUIDELINES
- High: test name + value + unit explicit
- Medium: partial inference required
- Low: heavy OCR ambiguity or missing units

### INPUT TEXT
{{CLEANED_OCR_TEXT}}
`;
```

---

## 🔗 Final Confidence Flow (Research-Consistent)

| Step            | Confidence Represents            |
| --------------- | -------------------------------- |
| OCR             | Handwriting legibility           |
| Classification  | Correct schema selection         |
| SOAP Extraction | Evidence strength + clarity      |
| Labs Extraction | Correct test/value normalization |

This gives you a **full chain-of-trust**, exactly what Spiral Prompt Engineering was designed to achieve.

---

If you want next, I can:

* Define a **confidence propagation rule** (e.g., min / weighted mean)
* Show how to **surface low-confidence fields in UI**
* Add **few-shot examples without leakage**
* Align confidence scoring numerically across Gemini vs GPT models

Just say the word.
