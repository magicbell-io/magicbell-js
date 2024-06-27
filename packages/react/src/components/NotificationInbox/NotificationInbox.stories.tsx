import { Meta } from '@storybook/react';
import React from 'react';

import { merge } from '../../lib/merge';
import MagicBellProvider from '../MagicBellProvider';
import NotificationInbox from './NotificationInbox';

const Component = ({ apiKey, userEmail, userKey, stores, theme, ...props }) => (
  <MagicBellProvider apiKey={apiKey} userEmail={userEmail} userKey={userKey} stores={stores} theme={theme}>
    <NotificationInbox {...props} />
  </MagicBellProvider>
);

const meta: Meta = {
  component: Component,
  argTypes: {
    onNotificationClick: { action: 'onNotificationClick' },
    onAllRead: { action: 'onAllRead' },
  },
};

export default meta;

export const Default = {
  args: {
    height: 400,
  },
};

export const WithCustomPreferences = merge(Default, {
  args: {
    NotificationPreferences: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <p>Your Settings Page</p>
      </div>
    ),
  },
});

export const WithPreferencesDisabled = merge(Default, {
  args: {
    notificationPreferencesEnabled: false,
  },
});

export const SplitInbox = merge(Default, {
  args: {
    stores: [
      { id: 'default', defaultQueryParams: {} },
      { id: 'unread', defaultQueryParams: { read: true } },
      { id: 'billing', defaultQueryParams: { category: 'billing' } },
    ],
    tabs: [
      { storeId: 'default', label: 'Latest' },
      { storeId: 'unread', label: 'Archive' },
      { storeId: 'billing', label: 'Billing' },
    ],
  },
});
