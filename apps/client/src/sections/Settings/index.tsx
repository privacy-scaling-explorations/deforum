import { PageContent } from "@/components/PageContent";
import { Banner } from "@/components/ui/Banner";
import { Avatar } from "./_Avatar";
import { BasicInfo } from "./_BasicInfo";
import { OpenSession } from "./_OpenSession";
import { AuthWrapper } from "@/components/AuthWrapper";
import { Switch } from "@/components/inputs/Switch";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useTranslation } from 'react-i18next';

export const SettingsPage = () => {
  const { isDarkMode, setIsDarkMode } = useGlobalContext();
  const { t } = useTranslation();
  
  return (
    <PageContent title={t('pages.settings.title')}>
      <AuthWrapper className="flex flex-col gap-6">
        <Banner.Base className="text-center">
          <Banner.Label size="sm">
            {t('pages.settings.complete_profile')}
          </Banner.Label>
        </Banner.Base>
        <Avatar />
        <BasicInfo />
        <OpenSession />
      </AuthWrapper>
      <div className="max-w-[200px]">
        <Switch
          label={t('pages.settings.dark_mode')}
          className="my-6"
          checked={isDarkMode}
          onChange={() => setIsDarkMode(!isDarkMode)}
        />
      </div>
    </PageContent>
  );
};
