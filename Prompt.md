    ## 1. Methodology Overview: "Spiral Prompt Engineering"

    The authors utilized a "Spiral Prompt Engineering" process, an iterative method where prompts were refined in phases to address specific failure modes (e.g., hallucinations, formatting errors). This evolved into a modular strategy combining **Chain-of-Thought (CoT)**, **Few-Shot Learning**, and **Schema Constraints**.

    ### The Evolution of the Prompt (Iterative Phases)

    - **Phase 1: Standardization (Prompt v1)**
        - **Goal:** Solve unstructured outputs.
        - **Technique:** Added constraints to force multiple-choice answers and JSON formatting.
        - **Key Instruction:** *"Output the whole set of answers together as a single JSON file..."*
    - **Phase 2: Evidence & Logic (Prompt v2)**
        - **Goal:** Reduce hallucinations.
        - **Technique:** Required the model to explicitly cite evidence from the text.
        - **Key Instruction:** *"Make valid inferences... based on evidence. If there is no available evidence... answer 'Unknown'."*
    - **Phase 3: Chain of Thought (Prompt v3)**
        - **Goal:** Improve classification accuracy by forcing intermediate reasoning.
        - **Technique:** Forced extraction of intermediate variables (e.g., `tumor size`) before making final stage classifications.
    - **Phase 4: Few-Shot Examples (Prompt v4)**
        - **Goal:** Complex logic demonstration.
        - **Technique:** Provided specific examples of deducing `Stage IB` from `pT` and `pN` values.

    ---

    ## 2. Master Prompt Specifications (Lung Cancer)

    ### Final Standardized Prompt Structure

    The complete prompt used for the primary evaluation is divided into **Instruction** and **Input** sections.

    ### Section 1: The Instruction Block

    > Preamble: "Based on the Diagnosis and Synoptic Data of the pathology report given in the Input Section, estimate the value and the certainty degree (CD: 0.00 to 1.00) for each of the following attributes..."
    > 
    > 
    > **Schema Definitions (Allowed Values):**
    > 
    > - `tumor size max_dimension`: [Value in cm, "Unknown"]
    > - `pT`: ["T0", "Tis", "T1", ... "Unknown"]
    > - `pN`: ["N0", "N1", ... "Unknown"]
    > - `tumor stage`: ["Stage 0", "Stage I", ... "Unknown"]
    > - `histologic diagnosis`: ["Lung Adenocarcinoma", ... "Unknown"]
    > 
    > **Output Requirement (Key-Value Pairs per Attribute):**
    > 
    > 1. `<attribute stated>`: Extracted value from report.
    > 2. `<attribute estimated>`: Estimated value based on AJCC 7th ed.
    > 3. `<attribute>_CD`: Certainty degree [0.00 - 1.00].
    > 4. `<attribute>_evidence`: Supporting text snippet.
    > 
    > Logic Injection:
    > 
    > "Please estimate the tumor stage category based on your estimated pT category and pN category and use AJCC7 criteria. For example, if pT is estimated as T2a, pN as N0, without information showing distant metastasis, then by AJCC7 criteria, the tumor stage is 'Stage IB'."
    > 
    > Formatting:
    > 
    > "Output the whole set of answers together as a single JSON file... Include 'comment' as the last key."
    > 

    ### Section 2: The Input Block

    > "[Contains a scanned pathology report on Lung Carcinoma for you to parse]"
    > 

    ---

    ## 3. Modular & Category-Specific Prompts (Pediatric/Osteosarcoma)

    For complex datasets, the authors decomposed the prompt into a modular architecture involving a general preamble, specific category sub-prompts, and few-shot examples.

    ### A. Overall Structure

    1. **General Preamble:** "This program extracts some information from doctors letters."
    2. **Category Sub-prompts:** (See below)
    3. **Few-Shot Block:** "Here are some examples:" + [Four randomly selected example letters with JSON results].
    4. **Target Input:** "Here comes the doctor's letter:" + [Query Letter].

    ### B. Category-Specific Instructions

    Each category has a dedicated instruction ending with *"The JSON variable should have the name XXX"*.

    | **Category** | **Instruction Snippet** |
    | --- | --- |
    | **Body Weight** | "The body weight in kilogram should be returned." |
    | **Age** | "The age at admission in completed months (or completed years) should be returned." |
    | **Sub-specialties** | "Return as a list. Valid values are, followed by a list of all pediatric sub-specialties." |
    | **Genetic Disorder** | "Assess if patient has probable/proven genetic condition. Valid values: True/False." |
    | **Patient for Study** | "Check inclusion criteria: Age 2-5, Admission due to proven/probable infection. Values: True/False." |

    ### C. Reasoning Constraints (CoT)

    For complex calculations (like Age), the few-shot examples demonstrate a "step-by-step" JSON structure rather than a simple answer:

    JSON

    # 

    `{
    "steps": [
        {
        "explanation": "The birthday is 2020-02-10 and presentation is 2020-02-14, therefore age is 0 completed years.",
        "output": {"age_years": 0}
        }
    ],
    "final_answer": {"age_years": 0}
    }`

    ---

    ## 4. Directed Acyclic Graph (DAG) Prompt Templates

    The authors used Microsoft Prompt Flow to organize prompts into a graph structure. These templates use `{{placeholders}}` for dynamic schema insertion.

    ### A. Feature/Report Templates (Single Label)

    - **Segmentation:** "Segment text relevant to {{feature}}... Unique instructions: {{segmentation}}"
    - **Standardization:** "Return a standardized label from {{labels}}... Unique instructions: {{standardization}}"

    ### B. IHC/FISH Templates (Complex/Multi-specimen)

    This requires a three-step flow:

    1. **Segmentation I:** "Segment text relevant to IHC/FISH... Unique instructions: {{segmentation 1}}"
    2. **Segmentation II:** "Organize the text by specimen and block... Unique instructions: {{segmentation 2}}"
    3. **Standardization:** "For each specimen and block, return standardized test names and results from {{test names}} {{test results}}. Favor the first test name {{synonyms}}."

    ### C. Specific Logic Refinements

    - **Missing Info:** "Use specimen X and block 0 if not stated in report."
    - **Intact Results:** "If report states 'Intact (positive...)', favor only 'Intact'."
    - **Modifiers:** "Add result modifiers in order of status, intensity, extent, and pattern."
    - **Metastasis:** "Direct tumor extension... does not constitute metastasis."
    - **Anatomical Context:** "Analyze position terms; e.g., 'peripancreatic mass' is not 'Pancreas'."

    ---

    ## 5. The "ChatSchema" Pipeline

    This section details the technique used to handle OCR errors and strict schema enforcement.

    ### Phase 1: Pre-Correction (OCR Cleaning)

    - **Goal:** Fix OCR inaccuracies (e.g., "l" vs "1") and formatting.
    - **Template:** The prompt highlights potential errors like positional errors or visually similar character confusion.

    ### Phase 2: Scenario Classification

    - **Goal:** Identify the report type to select the correct Schema.
    - **Instruction:** "Classify the OCR text scenario."
    - **Input:** [Schema List] + [OCR Text].
    - **Technique:** Few-shot conditional directives (e.g., *If text includes 'Total Iron Binding Capacity', classify as 'Five Iron Profile'*).

    ### Phase 3: Structured Information Extraction

    - **Goal:** Convert text to JSON using the selected Schema.
    - **Key Techniques:**
        - **Schema Injection:** The prompt explicitly includes the schema (Keys, Types, Units).
        - **Normalization:** Instructions to map colloquial terms to standard keys (e.g., "Sed rate" $\rightarrow$ "ESR").
        - **Unit Conversion:** Instructions to normalize units (e.g., "3m" $\rightarrow$ "300 cm").
        - **Value Mapping:** Mapping symbols like "+" to "Positive".

    ---

    ## 6. Technical Parameters

    - **Temperature:** Set to **0** for blank or irregular reports to ensure deterministic and consistent outputs.
    - **Output Constraint:** All prompts strictly enforce **JSON** format to ensure the data can be parsed into tabular structures.