import { GoogleGenAI } from '@google/genai';
import Swal from 'sweetalert2';
import { useStore } from '../store/useStore';

const MODELS = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite', 'gemini-2.5-pro'];

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const RETRYABLE_ERRORS = ['429', 'quota', '500', '503', 'RESOURCE_EXHAUSTED', 'UNAVAILABLE', 'INTERNAL', 'timeout', 'network'];

function isRetryableError(errorMessage: string): boolean {
  return RETRYABLE_ERRORS.some(code => errorMessage.toLowerCase().includes(code.toLowerCase()));
}

export async function callGeminiAI(prompt: string, modelIndex = 0, retryCount = 0): Promise<string | null> {
  const { settings } = useStore.getState();
  const apiKey = settings.apiKey;

  if (!apiKey) {
    Swal.fire({
      title: 'Chưa có API Key',
      html: `
        <p>Vui lòng nhập API Key trong phần <b>Cài đặt</b>!</p>
        <p class="text-sm mt-2">Bạn có thể lấy API Key miễn phí tại:</p>
        <a href="https://aistudio.google.com/apikey" target="_blank" class="text-blue-600 underline">
          https://aistudio.google.com/apikey
        </a>
      `,
      icon: 'warning',
    });
    return null;
  }

  const ai = new GoogleGenAI({ apiKey });
  const selectedModel = modelIndex === 0 ? settings.model : MODELS[modelIndex];

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });

    return response.text || '';
  } catch (error: any) {
    const errorMsg = error.message || '';
    console.error(`Gemini API Error (model: ${selectedModel}, retry: ${retryCount}):`, errorMsg);

    // Retry with same model if retryable error
    if (isRetryableError(errorMsg) && retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAY_MS * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGeminiAI(prompt, modelIndex, retryCount + 1);
    }

    // Fallback to next model if available
    if (modelIndex < MODELS.length - 1) {
      console.log(`Falling back to ${MODELS[modelIndex + 1]}...`);
      return callGeminiAI(prompt, modelIndex + 1, 0);
    }

    // All models exhausted - show quota notification
    if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
      Swal.fire({
        title: 'Hết quota API',
        html: `
          <p>API Key hiện tại đã hết lượt sử dụng miễn phí.</p>
          <div class="mt-3 text-left text-sm space-y-2">
            <p><b>Cách xử lý:</b></p>
            <p>1. Đăng nhập Gmail khác và lấy API Key mới tại:</p>
            <a href="https://aistudio.google.com/apikey" target="_blank" class="text-blue-600 underline block ml-4">
              aistudio.google.com/apikey
            </a>
            <p>2. Vào <b>Cài đặt</b> và thay API Key mới.</p>
          </div>
        `,
        icon: 'error',
        confirmButtonText: 'Đi tới Cài đặt',
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = '/settings';
        }
      });
    } else {
      Swal.fire('Lỗi API', errorMsg || 'Đã xảy ra lỗi khi gọi Gemini AI.', 'error');
    }

    return null;
  }
}

// ===== Tạo câu hỏi trắc nghiệm bằng AI (structured JSON output) =====

export interface GeneratedQuestion {
  content: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty?: string;
}

export async function generateQuestionsAI(
  topic: string,
  count: number,
  difficulty: string
): Promise<GeneratedQuestion[]> {
  const { settings } = useStore.getState();
  const apiKey = settings.apiKey;

  if (!apiKey) {
    Swal.fire({
      title: 'Chưa có API Key',
      html: `
        <p>Vui lòng nhập API Key trong phần <b>Cài đặt</b>!</p>
        <p class="text-sm mt-2">Bạn có thể lấy API Key miễn phí tại:</p>
        <a href="https://aistudio.google.com/apikey" target="_blank" class="text-blue-600 underline">
          https://aistudio.google.com/apikey
        </a>
      `,
      icon: 'warning',
    });
    throw new Error('Chưa có API Key');
  }

  const difficultyText = difficulty === 'mixed'
    ? 'hỗn hợp (bao gồm cả dễ, trung bình và khó)'
    : difficulty === 'easy' ? 'dễ' : difficulty === 'medium' ? 'trung bình' : 'khó';

  const prompt = `Tạo ${count} câu hỏi trắc nghiệm về chủ đề "${topic}" với độ khó ${difficultyText}.
Yêu cầu:
- Mỗi câu có 4 đáp án
- Chỉ 1 đáp án đúng
- Phù hợp với học sinh THCS/THPT
- Có giải thích ngắn gọn
- Giữ nguyên công thức toán dạng LaTeX $...$

Trả về JSON format:
[
  {
    "content": "Câu hỏi...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Giải thích...",
    "difficulty": "easy|medium|hard"
  }
]`;

  const ai = new GoogleGenAI({ apiKey });

  // Thử từng model theo thứ tự fallback
  for (let i = 0; i < MODELS.length; i++) {
    const model = i === 0 ? settings.model : MODELS[i];
    try {
      console.log(`[generateQuestionsAI] Đang thử model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '[]';
      const generated: GeneratedQuestion[] = JSON.parse(text);
      // Xóa tiền tố A., B., C., D. nếu AI vẫn thêm vào
      const cleaned = generated.map(q => ({
        ...q,
        options: q.options.map(opt => opt.replace(/^[A-D][\.)\:\/\-]\s*/i, '').trim())
      }));
      console.log(`[generateQuestionsAI] Thành công với model: ${model}`);
      return cleaned;
    } catch (error: any) {
      console.warn(`[generateQuestionsAI] Model ${model} thất bại:`, error.message);

      if (i === MODELS.length - 1) {
        if (
          error.message?.includes('quota') ||
          error.message?.includes('429') ||
          error.message?.includes('RESOURCE_EXHAUSTED')
        ) {
          Swal.fire({
            title: 'Hết quota API',
            html: `
              <p>API Key hiện tại đã hết lượt sử dụng miễn phí.</p>
              <div class="mt-3 text-left text-sm space-y-2">
                <p><b>Cách xử lý:</b></p>
                <p>1. Đăng nhập Gmail khác và lấy API Key mới tại:</p>
                <a href="https://aistudio.google.com/apikey" target="_blank" class="text-blue-600 underline block ml-4">
                  aistudio.google.com/apikey
                </a>
                <p>2. Vào <b>Cài đặt</b> và thay API Key mới.</p>
              </div>
            `,
            icon: 'error',
          });
          throw new Error('API Key đã hết quota');
        }
        throw new Error(`Tất cả model đều thất bại. Lỗi cuối: ${error.message}`);
      }
    }
  }

  return [];
}
