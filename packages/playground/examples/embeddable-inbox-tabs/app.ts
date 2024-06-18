import { renderWidget } from '@magicbell/embeddable';

const options = {
  apiKey: '__MAGICBELL_API_KEY__',
  userEmail: '__MAGICBELL_USER_EMAIL__',
  userKey: '__MAGICBELL_USER_KEY__',
  height: 500,
  stores: [
    { id: 'default', defaultQueryParams: {} },
    { id: 'unread', defaultQueryParams: { read: false } },
    { id: 'billing', defaultQueryParams: { category: 'billing' } },
  ],
  tabs: [
    { storeId: 'default', label: 'Latest' },
    { storeId: 'unread', label: 'Archive' },
    { storeId: 'billing', label: 'Billing' },
  ],
};

renderWidget(document.getElementById('app'), options);
