Architecture followed by most papers
1. Handwritten OCR
a. Convert handwritten clinical images into raw text.
2. Entity Extraction (NER)
a. Identify clinically meaningful entities: medications, dosages, diagnoses, identifiers, findings.
3. Normalization
a. Map noisy extracted strings to standardized concepts (e.g., correcting spellings, mapping drugs
to RxNorm).
4. Relation Extraction & Structuring
a. Link entities together (e.g., medication ↔ dosage ↔ frequency) and output them in structured
form.
Output Schema Fragmentation
Most systems output:
Task-specific JSON
CSVs
Database tables
Only 3 studies reference medical ontologies (ICD-9, UMLS, RxNorm)
Almost no alignment with interoperability standards (FHIR, HL7)
Schema-driven extraction (predefined key-value schemas guiding the model) significantly
improves accuracy and consistency.
Prompts for LLM
Doc
The
"Spiral-Schema
" Hybrid Prompting Strategy
Core Architecture: Two-Stage Information Extraction
Technique: Schema Placeholder Replacement (from ChatSchema). By defining distinct "buckets
" for
labs
ordered vs. labs
_
_
resulted, we ensure specific entities like SGPT are captured even when
numerical values are missing.
Robustness: Layout-Agnostic Parsing
Technique: Pattern-Based Entity Recognition (adapted from Feature/Specimen Set logic). The
prompt instructs the LLM to prioritize medical patterns (e.g.,
"Tab.
"
"
,
mg
") over OCR headers, preventing
medications from being misclassified as
"Chief Complaints
" due to flattened layouts.
Quality Control: The
"Spiral" Validation Loop
Technique: Evidence-Based Grounding (from Spiral Prompt Engineering). Forcing the output of
original
text and confidence
_
_
score for every field creates a
"Chain of Trust" that reduces
hallucinations and allows for easy auditing of noisy OCR data.
Medical Intelligence: Contextual Pre-correction
Technique: Clinical Inference (from ChatSchema). The model is primed to fix visually similar character
errors (e.g.,
"S6PT" → "SGPT") and normalize colloquialisms (e.g.,
"Schroderms
" → "Scleroderma
") using
internal medical knowledge.
Using LLMs
Mostly LLMs are being used after text already exists, not to create text from images.
OCR Ranking
Medical Bench