import { Card } from "@/components/cards/Card";
import { Input } from "@/components/inputs/Input";
import { Select } from "@/components/inputs/Select";
import { Textarea } from "@/components/inputs/Textarea";
import { Button } from "@/components/ui/Button";
import { useTranslation } from 'react-i18next';

export const BasicInfo = () => {
  const { t, i18n } = useTranslation();
  
  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <Card.Base className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Card.Title>{t('pages.settings.basic_info.title')}</Card.Title>

        <Card.Description>
          {t('pages.settings.basic_info.description')}
        </Card.Description>
      </div>
      <div className="flex flex-col gap-4 lg:grid-cols-2 lg:grid">
        <Input
          label={t('pages.settings.basic_info.username.label')}
          placeholder={t('pages.settings.basic_info.username.placeholder')}
        />
        <Input 
          label={t('pages.settings.basic_info.url.label')} 
          placeholder={t('pages.settings.basic_info.url.placeholder')} 
        />
        <Textarea
          containerClassName="lg:col-span-2"
          label={t('pages.settings.basic_info.about.label')}
          placeholder={t('pages.settings.basic_info.about.placeholder')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Select
          label={t('pages.settings.basic_info.home_page.label')}
          items={[
            {
              value: "home",
              label: t('pages.settings.basic_info.home_page.options.home')
            },
            {
              value: "profile",
              label: t('pages.settings.basic_info.home_page.options.profile')
            }
          ]}
        />
        <Select
          label={t('pages.settings.basic_info.language.label')}
          value={i18n.language}
          onValueChange={handleLanguageChange}
          items={[
            {
              value: "en",
              label: t('pages.settings.basic_info.language.options.en')
            },
            {
              value: "es",
              label: t('pages.settings.basic_info.language.options.es')
            }
          ]}
        />
      </div>
      <div className="py-4 flex justify-end">
        <Button>{t('actions.save')}</Button>
      </div>
    </Card.Base>
  );
};
