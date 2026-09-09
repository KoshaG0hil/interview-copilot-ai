import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdfjs worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  // Use CDN worker for maximum portability across Vite & Electron without static asset bundling quirks
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export const resumeParser = {
  async extractTextFromFile(file: File): Promise<string> {
    const fileType = (file.type || '').toLowerCase();
    const fileName = (file.name || '').toLowerCase();

    // Word Documents (.docx, .doc)
    if (
      fileName.endsWith('.docx') ||
      fileName.endsWith('.doc') ||
      fileType.includes('wordprocessingml') ||
      fileType.includes('msword') ||
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      return this.extractFromWord(file);
    }

    // PDF Documents (.pdf)
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.extractFromPdf(file);
    }

    // Rich Text Format (.rtf)
    if (fileName.endsWith('.rtf') || fileType === 'application/rtf' || fileType === 'text/rtf') {
      const rawText = await file.text();
      return this.cleanRtf(rawText);
    }

    // Plain text, markdown, csv, code
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  },

  async extractFromWord(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value && result.value.trim().length > 0) {
        return result.value.trim();
      }
    } catch (err: any) {
      console.warn('Mammoth docx extraction encountered issue, attempting fallback text extraction:', err);
    }

    // Fallback for .doc or unusual .docx structures: extract readable strings from binary buffer
    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let extracted = '';
      let currentWord = '';

      for (let i = 0; i < bytes.length; i++) {
        const charCode = bytes[i];
        // Printable ASCII and whitespace
        if ((charCode >= 32 && charCode <= 126) || charCode === 10 || charCode === 13 || charCode === 9) {
          currentWord += String.fromCharCode(charCode);
        } else {
          if (currentWord.length >= 4) {
            extracted += currentWord + ' ';
          }
          currentWord = '';
        }
      }
      if (currentWord.length >= 4) {
        extracted += currentWord;
      }

      // Clean up common binary Word header garbage
      const cleaned = extracted
        .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleaned.length > 50) {
        return cleaned.slice(0, 30000);
      }
    } catch (fallbackErr) {
      console.error('Word fallback parsing failed:', fallbackErr);
    }

    throw new Error('Unable to extract text from Word document. Please ensure it is a valid .docx or .doc file, or export it to PDF.');
  },

  async extractFromPdf(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageStrings = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += `--- Page ${pageNum} ---\n` + pageStrings + '\n\n';
      }

      return fullText.trim();
    } catch (err: any) {
      console.warn('PDF parsing with PDF.js failed, trying fallback array reader:', err);
      // Fallback: simple text extraction from buffer
      const text = await file.text();
      return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').slice(0, 15000);
    }
  },

  cleanRtf(rtf: string): string {
    return rtf
      .replace(/\\par[d]?/g, '\n')
      .replace(/\{\*?\\[^{}]+;\}|[{}]|\\\w+/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  },
};
