import { Card } from "@/components/cards/Card";
import { FileUploader } from "@/components/inputs/FileUploader";
import { useTranslation } from 'react-i18next';

export const Avatar = () => {
  const { t } = useTranslation();
  
  return (
    <Card.Base className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Card.Title>{t('pages.settings.avatar.title')}</Card.Title>

        <Card.Description>
          {t('pages.settings.avatar.description')}
        </Card.Description>
      </div>
      <FileUploader />
    </Card.Base>
  );
};
