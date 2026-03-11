import { Question } from '../store/useStore';

export function exportExamToHTML(
    questions: Question[],
    subjectName: string,
    options: { showAnswers?: boolean; title?: string } = {}
): void {
    const { showAnswers = false, title = `Đề Thi ${subjectName}` } = options;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 40px 30px; color: #1a1a1a; line-height: 1.6; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .header h1 { font-size: 22px; text-transform: uppercase; margin-bottom: 5px; }
    .header p { font-size: 14px; color: #666; }
    .info { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; }
    .info span { border-bottom: 1px dotted #999; min-width: 200px; display: inline-block; }
    .question { margin-bottom: 20px; page-break-inside: avoid; }
    .question-content { font-weight: bold; margin-bottom: 8px; }
    .options { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 20px; padding-left: 20px; }
    .option { padding: 2px 0; }
    .correct { background-color: #d4edda; padding: 2px 6px; border-radius: 3px; }
    .answer-key { margin-top: 40px; border-top: 2px solid #333; padding-top: 20px; }
    .answer-key h2 { margin-bottom: 10px; font-size: 18px; }
    .answer-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
    .answer-item { text-align: center; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="text-align:center; margin-bottom:20px;">
    <button onclick="window.print()" style="padding:10px 30px; font-size:16px; cursor:pointer; background:#2563eb; color:white; border:none; border-radius:8px;">
      🖨️ In đề thi
    </button>
  </div>

  <div class="header">
    <h1>${title}</h1>
    <p>Tổng số: ${questions.length} câu hỏi</p>
  </div>

  <div class="info">
    <div>Họ và tên: <span></span></div>
    <div>Lớp: <span style="min-width:100px;"></span></div>
  </div>

  ${questions.map((q, i) => `
    <div class="question">
      <div class="question-content">Câu ${i + 1}: ${q.content}</div>
      <div class="options">
        ${q.options.map((opt, j) => `
          <div class="option ${showAnswers && j === q.correctAnswer ? 'correct' : ''}">
            ${String.fromCharCode(65 + j)}. ${opt}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}

  ${showAnswers ? `
    <div class="answer-key">
      <h2>ĐÁP ÁN</h2>
      <div class="answer-grid">
        ${questions.map((q, i) => `
          <div class="answer-item">
            <strong>${i + 1}</strong>: ${String.fromCharCode(65 + q.correctAnswer)}
          </div>
        `).join('')}
      </div>
    </div>
  ` : ''}
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
}
