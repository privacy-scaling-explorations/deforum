import { Button } from "@/components/ui/Button";
import { Card } from "@/components/cards/Card";
import { classed } from "@tw-classed/react";
import { useTranslation } from 'react-i18next';

const SessionTableWrapper = classed.div(
  "h-10 flex items-center lg:grid lg:grid-cols-[1fr_150px_90px] gap-2",
);

const sessionMockData = [
  {
    id: 1,
    session: "Session 1",
    device: "Device 1",
    key: "1234567890",
    status: "Active",
  },
  {
    id: 2,
    session: "Session 2",
    device: "Device 2",
    key: "1234567890",
    status: "Active",
  },
];

export const OpenSession = () => {
  const { t } = useTranslation();
  
  return (
    <Card.Base className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Card.Title>{t('pages.settings.sessions.title')}</Card.Title>
        <Card.Description>
          {t('pages.settings.sessions.description')}
        </Card.Description>
      </div>
      <div className="flex flex-col">
        <SessionTableWrapper className="border-b border-base-border">
          <span className="text-sm font-medium text-base-muted-foreground">
            {t('pages.settings.sessions.headers.session')}
          </span>
          <span className="text-sm font-medium text-base-muted-foreground">
            {t('pages.settings.sessions.headers.device')}
          </span>
          <span></span>
        </SessionTableWrapper>
        {sessionMockData.map((session) => (
          <SessionTableWrapper
            key={session.id}
            className="border-b border-base-border h-[52px]"
          >
            <span className="text-sm text-base-foreground font-medium">
              {session.key}
            </span>
            <span className="text-sm text-base-foreground">{session.status}</span>
            <div>
              <Button variant="outline" className="!flex !w-full">
                {t('actions.sign_out')}
              </Button>
            </div>
          </SessionTableWrapper>
        ))}
      </div>
    </Card.Base>
  );
};
