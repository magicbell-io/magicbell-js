<template>
  <div ref="notifications">Notifications</div>
</template>

<script>
import { renderWidget } from '@magicbell/embeddable/dist/magicbell.esm.js';

const stores = [
  { id: 'default', defaultQueryParams: {} },
  { id: 'unread', defaultQueryParams: { read: true } },
  { id: 'billing', defaultQueryParams: { category: 'billing' } },
];

const tabs = [
  { storeId: 'default', label: 'Latest' },
  { storeId: 'unread', label: 'Archive' },
  { storeId: 'billing', label: 'Billing' },
];

export default {
  name: 'NotificationComponent',
  mounted: function () {
    const options = {
      apiKey: '__MAGICBELL_API_KEY__',
      userEmail: '__MAGICBELL_USER_EMAIL__',
      userKey: '__MAGICBELL_USER_KEY__',
      stores,
      tabs,
    };

    renderWidget(this.$refs.notifications, options);
  },
};
</script>
