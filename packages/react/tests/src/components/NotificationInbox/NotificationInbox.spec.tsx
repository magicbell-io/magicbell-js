import { useConfig, useNotificationPreferences } from '@magicbell/react-headless';
import { fake, mockHandler, mockHandlers, setupMockServer } from '@magicbell/utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';

import MagicBellProvider from '../../../../src/components/MagicBellProvider';
import NotificationInbox from '../../../../src/components/NotificationInbox';
import { renderWithProviders as render } from '../../../__utils__/render';
import ConfigFactory, { sampleConfig } from '../../../factories/ConfigFactory';
import { sampleNotification } from '../../../factories/NotificationFactory';

const server = setupMockServer(
  ...mockHandlers,
  mockHandler('get', '/notifications', {
    ...fake.notificationPage,
    notifications: [sampleNotification],
  }),
  mockHandler('get', '/notification_preferences', {
    notification_preferences: fake.notificationPreferences,
  }),
);

beforeEach(() => {
  useConfig.setState({ ...sampleConfig, lastFetchedAt: Date.now() });
});

test('renders a header, the list of notifications and a footer if the notifications are fetched', async () => {
  render(<NotificationInbox height={300} />);

  // header
  await screen.findByRole('heading', { name: /Notifications/ });

  // notification
  await waitFor(() => screen.getByText(/This is a good content/));

  // footer
  screen.getByRole('button', { name: /Notification preferences/ });
});

test('renders nothing if the notification store does not exist', () => {
  const { container } = render(
    <MagicBellProvider theme={{}} locale="en" images={{}} apiKey="-" userEmail="-">
      <NotificationInbox height={300} storeId="non-existing" />
    </MagicBellProvider>,
  );

  expect(container.textContent).toEqual('');
});

test('clicking the mark-all-read button invokes the onAllRead callback', async () => {
  const onAllRead = jest.fn();

  render(<NotificationInbox onAllRead={onAllRead} height={300} />);

  const button = await screen.findByRole('button', { name: /Mark all read/ });
  await userEvent.click(button);

  expect(onAllRead).toHaveBeenCalledTimes(1);
});

test('the mark-all-read button is not visible when there are no notifications', async () => {
  server.intercept('get', '/notifications', fake.notificationPage);

  render(<NotificationInbox />);

  expect(screen.queryByRole('button', { name: /Mark all read/ })).not.toBeInTheDocument();
});

test('renders a message and a image if there are no notifications', async () => {
  server.intercept('get', '/notifications', fake.notificationPage);

  render(<NotificationInbox />);

  await waitFor(() => screen.getByText(/We'll let you know when there's more./));
  screen.getByRole('img', { name: /No notifications/ });
});

test('can render with a custom no-notifications placeholder if there are no notifications', async () => {
  server.intercept('get', '/notifications', fake.notificationPage);

  const EmptyInboxPlaceholder = () => <div data-testid="empty-inbox-placeholder" />;
  render(<NotificationInbox EmptyInboxPlaceholder={EmptyInboxPlaceholder} />, { locale: 'en' });

  await waitFor(() => screen.findByTestId('empty-inbox-placeholder'));
  expect(screen.queryByText(/We'll let you know when there's more./)).not.toBeInTheDocument();
  expect(screen.queryByRole('img', { name: /No notifications/ })).not.toBeInTheDocument();
});

test('can render the inbox in Spanish', async () => {
  render(<NotificationInbox />, { locale: 'es' });
  await screen.findByRole('heading', { name: /Notificaciones/ });
  screen.getByRole('button', { name: /Preferencias/ });
  await screen.findByRole('button', { name: /Marcar todo como leído/ });
});

test('invokes the onAllRead callback when clicking the `mark all read` button', async () => {
  const onAllRead = jest.fn();
  render(<NotificationInbox onAllRead={onAllRead} />, { locale: 'en' });

  const markAllReadButton = await screen.findByRole('button', { name: /Mark all read/ });
  await userEvent.click(markAllReadButton);
  await waitFor(() => expect(onAllRead).toBeCalledTimes(1));
});

test('notification preferences can be disabled trough property', () => {
  render(<NotificationInbox notificationPreferencesEnabled={false} />, { locale: 'en' });
  expect(screen.queryByRole('button', { name: /Notification preferences/ })).not.toBeInTheDocument();
});

test('notification preferences can be disabled trough useConfig hook', () => {
  useConfig.setState(ConfigFactory.build({ inbox: { features: { notificationPreferences: { enabled: false } } } }));

  render(<NotificationInbox />, { locale: 'en' });
  expect(screen.queryByRole('button', { name: /Notification preferences/ })).not.toBeInTheDocument();
});

test('shows the user preferences panel when the preferences button is clicked', async () => {
  useNotificationPreferences.setState({ lastFetchedAt: undefined });

  render(<NotificationInbox />, { locale: 'en' });
  const preferencesButton = await screen.findByRole('button', { name: /Notification preferences/ });
  await userEvent.click(preferencesButton);

  const checkboxes = await waitFor(() => screen.getAllByRole('checkbox'));
  expect(checkboxes).toHaveLength(12);

  // clicking again closes the preferences
  await userEvent.click(screen.getByRole('button', { name: /Close preferences/ }));
  await waitFor(() => expect(screen.queryByRole('checkbox')).not.toBeInTheDocument());
});

test('the notifications panel contains a close button', async () => {
  useNotificationPreferences.setState({ lastFetchedAt: undefined });

  render(<NotificationInbox />, { locale: 'en' });
  const preferencesButton = await screen.findByRole('button', { name: /Notification preferences/ });
  await userEvent.click(preferencesButton);

  const checkboxes = await waitFor(() => screen.getAllByRole('checkbox'));
  expect(checkboxes).toHaveLength(12);

  // close the preferences, return to inbox
  const closeButton = screen.getByRole('button', { name: /close/i });
  await userEvent.click(closeButton);
  await waitFor(() => expect(screen.queryByRole('checkbox')).not.toBeInTheDocument());
});

test('can render with a custom notification preferences component', async () => {
  const NotificationPreferences = () => <div data-testid="notification-preferences" />;

  render(<NotificationInbox NotificationPreferences={NotificationPreferences} />, { locale: 'en' });
  const button = await screen.findByRole('button', { name: /Notification preferences/ });
  await userEvent.click(button);

  await waitFor(() => screen.getByTestId('notification-preferences'));
});

test('can render with multiple inbox tabs, and active tab changes when clicked', async () => {
  const stores = [
    { id: 'default', defaultQueryParams: {} },
    { id: 'comments', defaultQueryParams: { read: true, category: 'comments' } },
    { id: 'billing', defaultQueryParams: { category: 'billing' } },
  ];

  const tabs = [
    { storeId: 'default', label: 'Feed' },
    { storeId: 'comments', label: 'Comments' },
    { storeId: 'billing', label: 'Billing' },
  ];

  render(<NotificationInbox tabs={tabs} />, { stores });
  const feedTab = await screen.findByRole('tab', { name: /feed/i });
  const commentsTab = screen.getByRole('tab', { name: /comments/i });

  expect(feedTab).toHaveAttribute('aria-selected', 'true');
  expect(commentsTab).not.toHaveAttribute('aria-selected', 'true');

  await userEvent.click(commentsTab);
  expect(feedTab).not.toHaveAttribute('aria-selected', 'true');
  expect(commentsTab).toHaveAttribute('aria-selected', 'true');
});

// flaky test
test('renders notifications matching selected tab', async () => {
  const stores = [
    { id: 'default', defaultQueryParams: {} },
    { id: 'comments', defaultQueryParams: { read: true, category: 'comments' } },
  ];

  const tabs = [
    { storeId: 'default', label: 'Feed' },
    { storeId: 'comments', label: 'Comments' },
  ];

  server.intercept('get', '/notifications', (req) => ({
    ...fake.notificationPage,
    notifications: [
      {
        ...fake.notification,
        content: `notification in ${req.url.searchParams.get('category') || 'default'} tab`,
      },
    ],
  }));

  render(<NotificationInbox tabs={tabs} />, { stores });
  const feedTab = await screen.findByRole('tab', { name: /feed/i });
  const commentsTab = screen.getByRole('tab', { name: /comments/i });

  // navigate to feed tab
  await userEvent.click(feedTab);
  await screen.findByText(/notification in default tab/i);
  expect(screen.queryByText(/notification in comments tab/i)).not.toBeInTheDocument();

  // navigate to comments tab
  await userEvent.click(commentsTab);
  await screen.findByText(/notification in comments tab/i);
  expect(screen.queryByText(/notification in default tab/i)).not.toBeInTheDocument();

  // and back to feed tab, to ensure that there is no leakage
  await userEvent.click(feedTab);
  await screen.findByText(/notification in default tab/i);
  expect(screen.queryByText(/notification in comments tab/i)).not.toBeInTheDocument();
});
