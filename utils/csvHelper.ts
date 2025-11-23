import { PromptBlock } from '../types';

export const exportToCSV = (blocks: PromptBlock[]) => {
  const headers = ['Name', 'Tag', 'Content'];
  const rows = blocks.map(block => [
    `"${block.name.replace(/"/g, '""')}"`,
    `"${block.tag.replace(/"/g, '""')}"`,
    `"${block.content.replace(/"/g, '""')}"`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `prompt_library_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const parseCSV = (text: string): Omit<PromptBlock, 'id'>[] => {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const results: Omit<PromptBlock, 'id'>[] = [];
  
  // Skip header, start from index 1
  for (let i = 1; i < lines.length; i++) {
    // Simple regex to handle quoted CSV fields
    const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    // Fallback split if regex fails or simple structure
    const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    if (cols.length >= 3) {
      results.push({
        name: cols[0],
        tag: cols[1],
        content: cols[2]
      });
    }
  }
  return results;
};
