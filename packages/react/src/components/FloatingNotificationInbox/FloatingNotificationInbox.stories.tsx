import { Meta } from '@storybook/react';
import React from 'react';

import { merge } from '../../lib/merge';
import ClickableNotification, { ClickableNotificationProps } from '../ClickableNotification';
import FloatingNotificationInbox from '../FloatingNotificationInbox';
import MagicBell from '../MagicBell';
import MagicBellProvider from '../MagicBellProvider';

const Component = ({
  onAllRead,
  onNotificationClick,
  apiKey,
  userEmail,
  userKey,
  NotificationItem,
  theme,
  stores,
  tabs,
  ...props
}) => (
  <div className="flex flex-row justify-center p-4">
    <MagicBellProvider apiKey={apiKey} userEmail={userEmail} userKey={userKey} theme={theme} stores={stores}>
      <MagicBell {...(props as any)}>
        {(props) => (
          <FloatingNotificationInbox
            onAllRead={onAllRead}
            onNotificationClick={onNotificationClick}
            height={500}
            NotificationItem={NotificationItem}
            tabs={tabs}
            {...props}
          />
        )}
      </MagicBell>
    </MagicBellProvider>
  </div>
);

const meta: Meta = {
  component: Component,
  argTypes: {
    onAllRead: { action: 'onAllRead' },
    onNotificationClick: { action: 'onNotificationClick' },
  },
};

export default meta;

export const Default = {
  args: {
    locale: 'en',
  },
};

export const WithCustomIcon = merge(Default, {
  args: {
    BellIcon: (
      <svg viewBox="0 0 24 24">
        <path d="M10,21.75a2.087,2.087,0,0,0,4.005,0" />
        <line x1="12" y1="3" x2="12" y2="0.75" />
        <path d="M12,3a7.5,7.5,0,0,1,7.5,7.5c0,7.046,1.5,8.25,1.5,8.25H3s1.5-1.916,1.5-8.25A7.5,7.5,0,0,1,12,3Z" />
      </svg>
    ),
  },
});

export const WithCustomTheme = merge(Default, {
  args: {
    theme: {
      header: { backgroundColor: '#FAD776', textColor: '#161C2D' },
      footer: { backgroundColor: '#FAD776', textColor: '#161C2D' },
      notification: {
        unread: { backgroundColor: '#FAD776', backgroundOpacity: 0.1 },
      },
    },
  },
});

export const WithCustomThemeTwo = merge(Default, {
  args: {
    theme: {
      icon: { borderColor: '#6113A3', width: '24px' },
      unseenBadge: { backgroundColor: '#DF4759' },
      header: { backgroundColor: '#6113A3', textColor: '#ffffff', borderRadius: '16px' },
      footer: { backgroundColor: '#6113A3', textColor: '#ffffff', borderRadius: '16px' },
      notification: {
        default: { textColor: '#15091F', borderRadius: '8px', backgroundColor: '#6113A3' },
        unseen: { backgroundColor: '#6113A3' },
        unread: { backgroundColor: '#6113A3' },
      },
    },
  },
});

export const WithInboxOpen = merge(Default, {
  args: {
    defaultIsOpen: true,
  },
});

export const WithCustomEmptyImage = merge(Default, {
  args: {
    images: {
      emptyInboxUrl:
        'https://thumbs.dreamstime.com/b/inbox-box-cabinet-document-empty-project-blue-icon-abstract-cloud-background-148443579.jpg',
    },
  },
});

export const WithUnreadCount = merge(Default, {
  args: {
    bellCounter: 'unread',
  },
});

export const WithCustomBadge = merge(Default, {
  args: {
    bellCounter: 'unread',
    Badge: ({ count }) => (
      <div
        style={{
          position: 'absolute',
          background: '#5225c1',
          color: 'white',
          textAlign: 'center',
          fontSize: 12,
          top: -4,
          right: -2,
          width: 16,
          height: 16,
          padding: 2,
          borderRadius: 8,
        }}
      >
        {count}
      </div>
    ),
  },
});

export const WithoutRichText = merge(Default, {
  args: {
    bellCounter: 'unread',
    NotificationItem: (props: ClickableNotificationProps) => <ClickableNotification {...props} prose={false} />,
  },
});

export const WithConditionalRichText = merge(Default, {
  args: {
    bellCounter: 'unread',
    NotificationItem: (props: ClickableNotificationProps) => (
      <ClickableNotification {...props} prose={!/getting started/i.test(props.notification.title)} />
    ),
  },
});

export const WithSplitInbox = merge(Default, {
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
