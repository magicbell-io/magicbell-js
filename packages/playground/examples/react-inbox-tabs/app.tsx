import MagicBell, { FloatingNotificationInbox } from '@magicbell/magicbell-react';
import React from 'react';

const stores = [
  { id: 'default', defaultQueryParams: {} },
  { id: 'unread', defaultQueryParams: { read: false } },
  { id: 'billing', defaultQueryParams: { category: 'billing' } },
];

const tabs = [
  { storeId: 'default', label: 'Latest' },
  { storeId: 'unread', label: 'Archive' },
  { storeId: 'billing', label: 'Billing' },
];

export default function Index() {
  return (
    <MagicBell
      apiKey="__MAGICBELL_API_KEY__"
      userEmail="__MAGICBELL_USER_EMAIL__"
      userKey="__MAGICBELL_USER_KEY__"
      stores={stores}
      defaultIsOpen
    >
      {(props) => <FloatingNotificationInbox height={450} tabs={tabs} {...props} />}
    </MagicBell>
  );
}
