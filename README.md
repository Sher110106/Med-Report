# Medical Note Extraction Study

> Evaluating how 9 state-of-the-art AI models compare at converting handwritten clinical notes into structured SOAP representations, as evaluated by practicing physicians.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38B2AC?logo=tailwindcss)

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Single Agent** | Traditional single-model extraction (Gemini/Azure) |
| **Multi-Agent** | Dual-model pipeline with confidence-based selection |
| **Comparator** | Run 9 models in parallel and compare results |
| **Survey** | Physician evaluation interface (coming soon) |

## 🧬 Models Under Evaluation

### Closed-Source (Performance Ceiling)
- GPT-5-mini (Azure OpenAI)
- Gemini Pro 3.0 (Google AI)
- Claude Sonnet 4.5 (AWS Bedrock)

### Open Reasoning (Explicit Thinking)
- DeepSeek V3.2 (OpenRouter)
- GLM 4.7 (OpenRouter)
- Kimi K2 Thinking (OpenRouter)

### Open Medical (Specialization)
- Qwen2.5-72B-Instruct (OpenRouter)
- OpenBioLLM-70B (Coming Soon)
- Llama-3-Meditron-70B (Coming Soon)

## 📁 Project Structure

```
Med/
├── app/
│   ├── api/
│   │   ├── compare/            # Multi-model comparison endpoint
│   │   ├── extract-*/          # Single-model extraction endpoints
│   │   └── multi-agent/        # Dual-model pipeline
│   ├── comparator/             # 9-model comparison page
│   ├── extract/                # Single-agent extraction page
│   ├── multi-agent/            # Multi-agent mode page
│   └── page.tsx                # Landing page
├── components/
│   ├── ComparatorResults.tsx   # Model comparison grid
│   ├── MultiAgentResults.tsx   # Multi-agent results viewer
│   └── ...
├── lib/
│   ├── openrouter.ts           # OpenRouter API (DeepSeek, GLM, Kimi, Qwen)
│   ├── bedrock.ts              # AWS Bedrock (Claude)
│   ├── gemini.ts               # Google Gemini
│   ├── azure-openai.ts         # Azure OpenAI
│   ├── storage.ts              # JSON storage for model runs
│   └── prompts.ts              # All LLM prompts
└── data/                       # Stored model run results
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- API keys for: Gemini, Azure OpenAI, OpenRouter, AWS Bedrock

### Installation

```bash
git clone <repository-url>
cd Med
npm install
```

### Environment Variables

Create `.env.local`:

```env
# Google Gemini
GEMINI_API_KEY=your_key

# Azure OpenAI
AZURE_KEY=your_key

# OpenRouter (DeepSeek, GLM, Kimi, Qwen)
OPENROUTER_API_KEY=your_key

# AWS Bedrock (Claude)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_key
AWS_REGION=us-east-1
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📋 Processing Modes

| Mode | Description |
|------|-------------|
| **Single Agent** | Single-model SOAP/Labs extraction |
| **Multi-Agent** | Dual-model with confidence selection |
| **Comparator** | All 9 models in parallel |

## 🔬 Research Hypotheses

1. **H1: Reasoning Dividend** - Reasoning models (DeepSeek, GLM, Kimi) reduce hallucinations via explicit chain-of-thought
2. **H2: Alignment Tax** - Medical-tuned models show better terminology but lower instruction-following
3. **H3: Closed vs Open Gap** - Quality gap <10%, safety gap >20%

## 📊 Output Format

All models output structured SOAP JSON with confidence scores:

```json
{
  "soap_note": {
    "subjective": { "chief_complaint": "...", "symptoms": [...] },
    "objective": { "vitals": {...}, "physical_exam": {...} },
    "assessment": { "primary_diagnosis": {...} },
    "plan": { "medications": [...] }
  },
  "confidence_scores": { "overall": 0.85 }
}
```

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5.9
- **Styling**: Tailwind CSS 4.1
- **AI Providers**: Google AI, Azure OpenAI, OpenRouter, AWS Bedrock

## 📄 License

ISC License

---

Built with ❤️ for medical AI research
