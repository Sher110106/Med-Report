"use client";

import { useState } from "react";
import Link from "next/link";
import ImageUploader from "@/components/ImageUploader";
import ProcessingOptions from "@/components/ProcessingOptions";
import ResultsDisplay from "@/components/ResultsDisplay";
import LabsResultsDisplay from "@/components/LabsResultsDisplay";
import { SOAPNote } from "@/lib/types";

type ProcessingMode = "direct" | "two-stage" | "azure-two-stage" | "gemini-labs" | "azure-labs";

export default function ExtractPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("direct");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultData, setResultData] = useState<any>(undefined);
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
      setResultData(result.data);
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
      setResultData(soapResult.data);
      setProcessingTime(soapResult.processingTime);
    } else {
      throw new Error(soapResult.error);
    }
  };

  const handleAzureTwoStageProcessing = async () => {
    if (!selectedFile) return;

    // Stage 1: OCR extraction with Gemini Flash
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

    // Stage 2: SOAP extraction with Azure OpenAI GPT-5-mini
    const soapResponse = await fetch("/api/extract-soap-azure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ocrText: ocrResult.rawText }),
    });

    const soapResult = await soapResponse.json();
    if (soapResult.success) {
      setResultData(soapResult.data);
      setProcessingTime(soapResult.processingTime);
    } else {
      throw new Error(soapResult.error);
    }
  };

  const handleGeminiLabsProcessing = async () => {
    if (!selectedFile) return;

    // Stage 1: OCR extraction with Gemini Flash
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

    // Stage 2: Labs extraction with Gemini Pro
    const labsResponse = await fetch("/api/extract-labs-gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ocrText: ocrResult.rawText }),
    });

    const labsResult = await labsResponse.json();
    if (labsResult.success) {
      setResultData(labsResult.data);
      setProcessingTime(labsResult.processingTime);
    } else {
      throw new Error(labsResult.error);
    }
  };

  const handleAzureLabsProcessing = async () => {
    if (!selectedFile) return;

    // Stage 1: OCR extraction with Gemini Flash
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

    // Stage 2: Labs extraction with Azure OpenAI GPT-5-mini
    const labsResponse = await fetch("/api/extract-labs-azure", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ocrText: ocrResult.rawText }),
    });

    const labsResult = await labsResponse.json();
    if (labsResult.success) {
      setResultData(labsResult.data);
      setProcessingTime(labsResult.processingTime);
    } else {
      throw new Error(labsResult.error);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setError(undefined);
    setResultData(undefined);
    setRawOCRText(undefined);

    try {
      switch (processingMode) {
        case "direct":
          await handleDirectProcessing();
          break;
        case "two-stage":
          await handleTwoStageProcessing();
          break;
        case "azure-two-stage":
          await handleAzureTwoStageProcessing();
          break;
        case "gemini-labs":
          await handleGeminiLabsProcessing();
          break;
        case "azure-labs":
          await handleAzureLabsProcessing();
          break;
      }
    } catch (err: any) {
      setError(err.message || "Processing failed");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getLoadingText = () => {
    switch (processingMode) {
      case "direct":
        return "Processing image...";
      case "two-stage":
        return "Stage 1: Extracting OCR text (Gemini)...";
      case "azure-two-stage":
        return "Stage 1: Extracting OCR text (Azure)...";
      case "gemini-labs":
        return "Stage 1: Extracting OCR text (Labs/Gemini)...";
      case "azure-labs":
        return "Stage 1: Extracting OCR text (Labs/Azure)...";
    }
  };

  const showRawText = processingMode !== "direct";

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back Navigation */}
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-black transition-colors mb-8 group"
        >
          <svg 
            className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            Medical Note Extractor
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
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
              <p className="mt-2 text-gray-600">{getLoadingText()}</p>
            </div>
          )}

          {/* Raw OCR Text Display */}
          {showRawText && rawOCRText && (
            <div className="w-full max-w-4xl bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold mb-3 text-black">Raw OCR Text</h3>
              <pre className="whitespace-pre-wrap text-sm font-mono bg-white p-4 rounded border border-gray-200">
                {rawOCRText}
              </pre>
            </div>
          )}

          {/* Results Display */}
          {resultData && (
            (processingMode === "gemini-labs" || processingMode === "azure-labs") ? (
              <LabsResultsDisplay data={resultData} processingTime={processingTime} />
            ) : (
              <ResultsDisplay
                soapData={resultData}
                rawText={rawOCRText}
                processingTime={processingTime}
                showRawText={false}
              />
            )
          )}
        </div>
      </div>
    </main>
  );
}
