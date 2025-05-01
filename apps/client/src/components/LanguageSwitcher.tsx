import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' }
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
    >
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  );
} 