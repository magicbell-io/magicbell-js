import MagicBell, { ClassicBellIcon, classicTheme, FloatingNotificationInbox } from '@magicbell/magicbell-react';
import React from 'react';

export default function Index() {
  return (
    <MagicBell
      apiKey="__MAGICBELL_API_KEY__"
      userEmail="__MAGICBELL_USER_EMAIL__"
      userKey="__MAGICBELL_USER_KEY__"
      BellIcon={<ClassicBellIcon />}
      theme={classicTheme}
      defaultIsOpen
    >
      {(props) => <FloatingNotificationInbox height={450} {...props} />}
    </MagicBell>
  );
}
