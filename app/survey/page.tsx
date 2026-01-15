"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import ImageModal from "@/components/ImageModal";
import SurveyForm, { type ModelResponse } from "@/components/SurveyForm";

interface ImageInfo {
  id: string;
  filename: string;
  path: string;
  modelsAvailable: string[];
}

interface SurveyData {
  imageId: string;
  models: string[];
  results: Record<string, Record<string, unknown> | null>;
}

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[], seed: number): T[] {
  const result = [...array];
  let currentIndex = result.length;
  
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(seededRandom() * currentIndex);
    currentIndex--;
    [result[currentIndex], result[randomIndex]] = [result[randomIndex], result[currentIndex]];
  }
  return result;
}

export default function SurveyPage() {
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentModelIndex, setCurrentModelIndex] = useState(0);
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [responses, setResponses] = useState<Record<string, ModelResponse>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedImages, setCompletedImages] = useState<Set<string>>(new Set());
  const [mobileTab, setMobileTab] = useState<"image" | "survey">("survey");
  const [showImageSelector, setShowImageSelector] = useState(false);

  const currentImage = images[currentImageIndex];

  const shuffledModels = useMemo(() => {
    if (!surveyData?.models) return [];
    return shuffleArray(surveyData.models, currentImageIndex + 1);
  }, [surveyData?.models, currentImageIndex]);

  const currentModel = shuffledModels[currentModelIndex];
  const currentModelOutput = surveyData?.results?.[currentModel] || null;

  useEffect(() => {
    async function loadImages() {
      try {
        const res = await fetch("/api/survey/images");
        const data = await res.json();
        setImages(data.images || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load images:", error);
        setIsLoading(false);
      }
    }
    loadImages();
  }, []);

  const loadSurveyData = useCallback(async (imageId: string) => {
    try {
      const res = await fetch(`/api/survey?imageId=${imageId}`);
      const data = await res.json();
      setSurveyData(data);
      setCurrentModelIndex(0);
      setResponses({});
    } catch (error) {
      console.error("Failed to load survey data:", error);
    }
  }, []);

  useEffect(() => {
    if (currentImage) {
      loadSurveyData(currentImage.id);
    }
  }, [currentImage, loadSurveyData]);

  const handleModelSubmit = useCallback(
    async (response: ModelResponse) => {
      if (!currentModel) return;

      const newResponses = { ...responses, [currentModel]: response };
      setResponses(newResponses);

      if (Object.keys(newResponses).length === 7) {
        setIsSubmitting(true);
        try {
          const res = await fetch("/api/survey", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageId: currentImage?.id, responses: newResponses }),
          });

          if (res.ok) {
            setCompletedImages((prev) => new Set([...prev, currentImage?.id || ""]));
            setShowSuccess(true);
          } else {
            const error = await res.json();
            alert(`Failed to submit: ${error.error || "Unknown error"}`);
          }
        } catch (error) {
          console.error("Failed to submit survey:", error);
          alert("Failed to submit survey. Please try again.");
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setCurrentModelIndex((prev) => prev + 1);
      }
    },
    [currentModel, responses, currentImage]
  );

  const handleContinue = useCallback(() => {
    setShowSuccess(false);
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex((prev) => prev + 1);
    } else {
      alert("🎉 You have completed all images! Thank you for your evaluation.");
    }
  }, [currentImageIndex, images.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No images available for survey.</p>
          <Link href="/" className="text-black hover:underline">Return to home</Link>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-gray-500 hover:text-black flex items-center gap-1 sm:gap-2 transition-colors">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </Link>
            <h1 className="text-base sm:text-xl font-bold text-black">Doctor Survey</h1>
            <div className="text-gray-500 text-xs sm:text-sm">
              {completedImages.size}/{images.length}
            </div>
          </div>
        </div>
      </header>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center border border-gray-200 shadow-2xl">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-black mb-2 sm:mb-3">Survey Submitted!</h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
              All 7 model evaluations have been saved.
            </p>
            <button
              onClick={handleContinue}
              className="w-full py-3 sm:py-4 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-all text-sm sm:text-base"
            >
              {currentImageIndex < images.length - 1 ? "Continue →" : "Complete"}
            </button>
          </div>
        </div>
      )}

      {/* Image Selector Modal (Mobile) */}
      {showImageSelector && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setShowImageSelector(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <h3 className="font-semibold text-black mb-3">Select Medical Note</h3>
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => { setCurrentImageIndex(idx); setShowImageSelector(false); }}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? "border-black ring-2 ring-black/20" :
                    completedImages.has(img.id) ? "border-green-500" : "border-gray-200"
                  }`}
                >
                  <img src={img.path} alt={img.id} className="w-full h-full object-cover" />
                  {completedImages.has(img.id) && (
                    <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center">{idx + 1}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Tab Bar */}
      <div className="lg:hidden flex-shrink-0 bg-gray-50 border-b border-gray-200 px-2 py-2">
        <div className="flex items-center gap-2">
          {/* Image selector button */}
          <button
            onClick={() => setShowImageSelector(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
          >
            <img src={currentImage?.path} alt="" className="w-8 h-8 rounded object-cover" />
            <span className="font-medium">#{currentImageIndex + 1}</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Tab buttons */}
          <div className="flex-1 flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => setMobileTab("image")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mobileTab === "image" ? "bg-black text-white" : "text-gray-600"
              }`}
            >
              View Image
            </button>
            <button
              onClick={() => setMobileTab("survey")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                mobileTab === "survey" ? "bg-black text-white" : "text-gray-600"
              }`}
            >
              Rate ({Object.keys(responses).length}/7)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Desktop Layout */}
        <div className="hidden lg:flex h-full max-w-7xl mx-auto px-4 py-4 gap-6">
          {/* Desktop Image Slider */}
          <div className="w-64 flex-shrink-0 flex flex-col">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Select Note</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === currentImageIndex ? "border-black ring-2 ring-black/20" :
                    completedImages.has(img.id) ? "border-green-500" : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img src={img.path} alt={img.id} className="w-full h-full object-cover" />
                  {completedImages.has(img.id) && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin">
              {/* Image */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="relative bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 cursor-zoom-in group hover:border-black transition-colors"
              >
                <img src={currentImage?.path} alt={currentImage?.id} className="w-full h-auto" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                    <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Model Progress */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500 mb-2">Progress ({Object.keys(responses).length}/7)</h4>
                <div className="space-y-1.5">
                  {shuffledModels.map((_, idx) => {
                    const modelAtPosition = shuffledModels[idx];
                    const isCompleted = !!responses[modelAtPosition];
                    const isCurrent = idx === currentModelIndex;
                    return (
                      <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg text-xs transition-all ${
                        isCurrent ? "bg-black text-white" : isCompleted ? "bg-green-50 border border-green-200" : "bg-white border border-gray-200"
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium ${
                          isCompleted ? "bg-green-500 text-white" : isCurrent ? "bg-white text-black" : "bg-gray-100 text-gray-500"
                        }`}>
                          {isCompleted ? "✓" : idx + 1}
                        </div>
                        <span>Model {idx + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Survey Form */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {currentModel && (
              <SurveyForm
                key={`${currentImage?.id}-${currentModel}`}
                modelName={`Model ${currentModelIndex + 1}`}
                modelOutput={currentModelOutput}
                onSubmit={handleModelSubmit}
                isSubmitting={isSubmitting}
              />
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden h-full overflow-y-auto">
          {mobileTab === "image" ? (
            <div className="p-4 space-y-4">
              {/* Image View */}
              <div
                onClick={() => setIsModalOpen(true)}
                className="relative bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 cursor-zoom-in"
              >
                <img src={currentImage?.path} alt={currentImage?.id} className="w-full h-auto" />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Tap to zoom
                </div>
              </div>

              {/* Model Progress */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Model Progress</h4>
                <div className="flex flex-wrap gap-2">
                  {shuffledModels.map((_, idx) => {
                    const modelAtPosition = shuffledModels[idx];
                    const isCompleted = !!responses[modelAtPosition];
                    const isCurrent = idx === currentModelIndex;
                    return (
                      <div key={idx} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                        isCurrent ? "bg-black text-white ring-2 ring-black/20" :
                        isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                      }`}>
                        {isCompleted ? "✓" : idx + 1}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setMobileTab("survey")}
                className="w-full py-3 bg-black text-white rounded-xl font-medium"
              >
                Go to Rating Form →
              </button>
            </div>
          ) : (
            <div className="p-4">
              {/* Quick image preview bar */}
              <div className="flex items-center gap-3 mb-4 p-2 bg-gray-50 rounded-lg border border-gray-200">
                <img
                  src={currentImage?.path}
                  alt=""
                  className="w-12 h-12 rounded object-cover cursor-pointer"
                  onClick={() => setIsModalOpen(true)}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-black">Note #{currentImageIndex + 1}</div>
                  <div className="text-xs text-gray-500">Model {currentModelIndex + 1} of 7</div>
                </div>
                <button
                  onClick={() => setMobileTab("image")}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-200 rounded-lg"
                >
                  View
                </button>
              </div>

              {currentModel && (
                <SurveyForm
                  key={`${currentImage?.id}-${currentModel}`}
                  modelName={`Model ${currentModelIndex + 1}`}
                  modelOutput={currentModelOutput}
                  onSubmit={handleModelSubmit}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageSrc={currentImage?.path || ""}
        imageAlt={currentImage?.id || "Medical Note"}
      />

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar { width: 6px; height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background: #999; }
      `}</style>
    </main>
  );
}
