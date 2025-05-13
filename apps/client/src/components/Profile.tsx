import { Button } from "@/components/ui/Button"
import { useState } from "react"
import { LoginModal } from "@/sections/Login/LoginModal"
import { AuthWrapper } from "./AuthWrapper"
import { Avatar } from "./Avatar"
import { useGlobalContext } from "@/contexts/GlobalContext"
import { useTranslation } from 'react-i18next'
import { useNavigate } from "@tanstack/react-router"

export function Profile() {
  //const { auth, setAuth } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const { user } = useGlobalContext()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleAvatarClick = () => {
    navigate({ to: '/settings' })
  }

  return (
    <>
      <LoginModal isOpen={isLoginModalOpen} setIsOpen={setIsLoginModalOpen} />
      <AuthWrapper
        fallback={
          <div className="flex items-center gap-3">
            <Button onClick={() => setIsLoginModalOpen(true)}>
              {t('actions.login')}
            </Button>
          </div>
        }
      >
        <Avatar src={user?.avatar ?? undefined} onClick={handleAvatarClick} />
      </AuthWrapper>
    </>
  )

  /*
  return auth.mapOrSync(
    <>
      <div className="flex items-center gap-3">
        <Button
          onClick={() => {
            setIsLoginModalOpen(true);
            //setAuth(undefined);
          }}
        >
          Login
        </Button>
      </div>
      <LoginModal isOpen={isLoginModalOpen} setIsOpen={setIsLoginModalOpen} />
    </>,
    ({ username }) => <div>{username}</div>,
  );*/
}
