import { useTranslation } from "react-i18next";
import { Accordion } from "./Accordion";
import { Globe } from "lucide-react";

const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'ru', label: 'Русский' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'pt', label: 'Português' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'ur', label: 'اردو' },
  { code: 'ja', label: '日本語' },
  { code: 'ar', label: 'العربية' },
  { code: 'vi', label: 'Tiếng Việt' }
]



export const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

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
};
