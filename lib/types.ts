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
