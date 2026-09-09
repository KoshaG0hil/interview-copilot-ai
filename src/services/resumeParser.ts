import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  // Use CDN worker for maximum portability across Vite & Electron without static asset bundling quirks
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

export const resumeParser = {
  async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.extractFromPdf(file);
    }

    // Plain text, markdown, or code
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
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
};
