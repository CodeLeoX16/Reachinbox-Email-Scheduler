import Papa from 'papaparse';

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function parseEmailsFromFile(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = String(e.target?.result || '');
      // Parse via PapaParse first to handle structured CSV columns cleanly
      const parsed = Papa.parse<string[]>(content, { skipEmptyLines: true });
      const flatText = parsed.data.flat().join(' ') + ' ' + content;
      const matches = flatText.match(EMAIL_REGEX) || [];
      const uniqueEmails = Array.from(new Set(matches.map((m) => m.toLowerCase().trim())));
      resolve(uniqueEmails);
    };
    reader.onerror = () => reject(new Error('Failed to read uploaded file'));
    reader.readAsText(file);
  });
}

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}