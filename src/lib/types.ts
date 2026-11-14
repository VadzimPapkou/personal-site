export type Lang = "ru" | "en";

export type Achievement = {
  action: string;
  result?: string;
};

export type ExperienceItem = {
  company: string;
  position: string;
  startDate: string;
  endDate: string | null;
  location: string;
  description: string;
  subtitle?: string;
  achievements?: Achievement[];
};

export type Skill = {
  name: string;
  icon: string;
};

export type Locale = {
  name: string;
  title: string;
  phone: string;
  location: string;
  telegram: string;
  seo: {
    baseUrl: string;
    pageTitle: string;
    description: string;
    keywords: string;
  };
  sections: {
    experience: string;
    skills: string;
    education: string;
    languages: string;
  };
  experience: ExperienceItem[];
  skills: {
    list: Skill[];
  };
  education: {
    university: string;
    degree: string;
    startDate: string;
    endDate: string;
  };
  languages: {
    russian: string;
    russianLevel: string;
    english: string;
    englishLevel: string;
  };
  languageSwitcher: {
    ru: string;
    en: string;
  };
  resumeDownload: string;
};
