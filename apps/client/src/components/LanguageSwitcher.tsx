import { useTranslation } from "react-i18next";
import { Accordion } from "./Accordion";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const languageLabel = languages.find(
    (lang) => lang.code === i18n.language
  )?.label;

  return (
    <div className="flex items-center gap-2 py-6">
      <Globe className="text-base text-base-foreground" size={16} />
      <Accordion
        defaultOpen={false}
        buttonClassName="!text-sm !font-medium"
        items={[
          {
            label: (
              <span className="font-sans font-medium text-base-muted-foreground text-sm text-left">
                {languageLabel}
              </span>
            ),
            children: (
              <div className="flex flex-col">
                {languages.map((lang) => (
                  <div
                    key={lang.code}
                    className="flex items-center gap-2"
                    onClick={() => i18n.changeLanguage(lang.code)}
                  >
                    {lang.label}
                  </div>
                ))}
              </div>
            ),
          },
        ]}
      />
    </div>
  );

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
};
