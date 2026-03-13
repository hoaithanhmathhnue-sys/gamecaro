// File Parser - Đọc nội dung từ file Word (.docx) và PDF (.pdf)
// Adapted from rungchuongvang-main/src/services/fileParser.ts
import mammoth from 'mammoth';
import { GoogleGenAI } from '@google/genai';

const MODEL_FALLBACK_ORDER = [
  'gemini-2.5-flash',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-lite',
  'gemini-2.5-pro',
];

/**
 * Đọc text từ file Word (.docx) hoặc PDF (.pdf)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'docx' || ext === 'doc') {
    return extractFromDocx(file);
  } else if (ext === 'pdf') {
    return extractFromPdf(file);
  } else {
    throw new Error('Chỉ hỗ trợ file .docx và .pdf');
  }
}

async function extractFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item: any) => item.str)
      .join(' ');
    pages.push(text);
  }

  return pages.join('\n\n');
}

/**
 * Dùng Gemini API để phân tích text từ file và trích xuất câu hỏi trắc nghiệm
 */
export async function parseQuestionsFromText(
  apiKey: string,
  text: string,
  count: number,
  difficulty: string
): Promise<any[]> {
  const ai = new GoogleGenAI({ apiKey });

  const difficultyPrompt = difficulty === 'mixed'
    ? 'hỗn hợp (bao gồm cả dễ, trung bình và khó)'
    : difficulty === 'easy' ? 'dễ' : difficulty === 'medium' ? 'trung bình' : 'khó';

  const prompt = `Phân tích nội dung đề thi/bài tập sau và trích xuất ${count} câu hỏi trắc nghiệm (mức độ ${difficultyPrompt}).

Nội dung file:
---
${text.substring(0, 15000)}
---

Trả về JSON array, mỗi phần tử có format:
{
  "content": "Nội dung câu hỏi (giữ nguyên công thức toán dạng $...$)",
  "options": ["Đáp án 1", "Đáp án 2", "Đáp án 3", "Đáp án 4"], // KHÔNG BAO GỒM CÁC TIỀN TỐ "A. ", "B. ", "C. ", "D. " VÀO ĐÂY
  "correctAnswer": 0,
  "explanation": "Giải thích đáp án",
  "difficulty": "easy|medium|hard"
}

Lưu ý:
- Giữ nguyên công thức toán ở dạng LaTeX ($...$)
- correctAnswer là index (0=A, 1=B, 2=C, 3=D)
- Nếu file có sẵn đáp án thì dùng đáp án đó
- Nếu không đủ ${count} câu thì trả về bao nhiêu câu có được
- CHỈ trả về JSON array, không giải thích thêm`;

  for (let i = 0; i < MODEL_FALLBACK_ORDER.length; i++) {
    const model = MODEL_FALLBACK_ORDER[i];
    try {
      console.log(`[FileParser] Đang thử model: ${model}`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const generated = JSON.parse(jsonMatch[0]);
        // Xóa các tiền tố A., B., C., D. hoặc A), B) nếu AI vẫn lặp lại
        console.log(`[FileParser] Thành công với model: ${model}`);
        return generated.map((q: any) => ({
          ...q,
          options: q.options.map((opt: string) => opt.replace(/^[A-D][\.)\:\/\-]\s*/i, '').trim())
        }));
      }
      throw new Error('Không parse được JSON từ response');
    } catch (err: any) {
      console.warn(`[FileParser] Model ${model} thất bại:`, err.message);
      if (i === MODEL_FALLBACK_ORDER.length - 1) {
        if (
          err.message?.includes('quota') ||
          err.message?.includes('429') ||
          err.message?.includes('RESOURCE_EXHAUSTED')
        ) {
          throw new Error(
            'API Key đã hết quota! Vui lòng lấy API key từ một Gmail khác tại https://aistudio.google.com/api-keys hoặc chờ đến ngày mai.'
          );
        }
        throw new Error(`Không thể phân tích file. Lỗi: ${err.message}`);
      }
    }
  }
  throw new Error('Không thể phân tích file');
}
