import { saveAs } from 'file-saver';
import { sampleTemplate } from '../templates/sampleTemplate';
import type { Template } from '../types';

export function cloneTemplate(template: Template, name?: string): Template {
  const now = new Date().toISOString();
  return {
    ...JSON.parse(JSON.stringify(template)),
    id: crypto.randomUUID(),
    name: name || `${template.name} Copy`,
    createdAt: now,
    updatedAt: now,
  };
}

export function createBlankTemplate(): Template {
  const now = new Date().toISOString();
  return {
    ...JSON.parse(JSON.stringify(sampleTemplate)),
    id: crypto.randomUUID(),
    name: 'Untitled ID Template',
    description: 'Blank editable card template.',
    createdAt: now,
    updatedAt: now,
    frontElements: [],
    backElements: [],
  };
}

export async function saveTemplate(template: Template) {
  const current = JSON.parse(localStorage.getItem('templates') || '[]');
  const existingIndex = current.findIndex((t: Template) => t.id === template.id);
  if (existingIndex >= 0) {
    current[existingIndex] = template;
  } else {
    current.push(template);
  }
  localStorage.setItem('templates', JSON.stringify(current));
  return true;
}

export async function exportTemplate(template: Template) {
  const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
  saveAs(blob, `${template.name}.json`);
  return true;
}

export function importTemplate(): Promise<Template | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target?.result as string) as Template;
          resolve({ ...parsed, id: parsed.id || crypto.randomUUID(), updatedAt: new Date().toISOString() });
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function ensureSampleTemplate(existing: Template[]) {
  if (existing.length) return existing;
  await saveTemplate(sampleTemplate);
  return [sampleTemplate];
}
