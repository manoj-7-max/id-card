import { create } from 'zustand';

export type SupportedLanguage = 'en' | 'es' | 'fr';

const translations = {
  en: {
    exportAndPrint: "Export & Print",
    saveTemplate: "Save Template",
    importData: "Import Data",
    properties: "Properties",
    templates: "Templates",
    elements: "Elements",
    text: "Text",
    images: "Images",
    layers: "Layers",
    front: "Front",
    back: "Back",
  },
  es: {
    exportAndPrint: "Exportar e Imprimir",
    saveTemplate: "Guardar Plantilla",
    importData: "Importar Datos",
    properties: "Propiedades",
    templates: "Plantillas",
    elements: "Elementos",
    text: "Texto",
    images: "Imágenes",
    layers: "Capas",
    front: "Frente",
    back: "Dorso",
  },
  fr: {
    exportAndPrint: "Exporter et Imprimer",
    saveTemplate: "Enregistrer le Modèle",
    importData: "Importer des Données",
    properties: "Propriétés",
    templates: "Modèles",
    elements: "Éléments",
    text: "Texte",
    images: "Images",
    layers: "Couches",
    front: "Devant",
    back: "Arrière",
  }
};

export type TranslationKey = keyof typeof translations.en;

interface LocaleState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: TranslationKey) => string;
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
  t: (key) => {
    const lang = get().language;
    return translations[lang][key] || translations['en'][key] || key;
  }
}));
