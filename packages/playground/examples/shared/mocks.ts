import axios, { Method } from 'axios';

// Inject our axios instance to @magicbell/react-headless, so it uses our interceptors
const target = typeof window === 'undefined' ? global : window;
target['__MAGICBELL_HOOKS__'] = target['__MAGICBELL_HOOKS__'] || {};
target['__MAGICBELL_HOOKS__']['axios'] = axios;

let count = 0;
const id = (prefix: string) => `${prefix}_${++count}`;
const timeAgo = (seconds: number) => Math.floor(Date.now() / 1000) - seconds;

/**
 * Url pattern matcher
 *
 * @param pattern - string, example /notifications/:id/seen
 * @param url - string, example /notifications/1/seen
 *
 * @returns { match: boolean, pattern: string, params: { [key: string]: string } }
 */
function match(pattern, url) {
  if (pattern === url) return { match: true, pattern, params: {} };

  const escapedPattern = pattern.replace(/[?&.]/g, '\\$&');
  const matches = escapedPattern.match(/:([^?\/\\]+)/g);
  const keys = matches ? matches.map((e) => e.slice(1)) : null;

  const expression = new RegExp(
    `^${escapedPattern
      .replace(/:[^\/&.?]+/g, '([^/]+)')
      .replace(/\)\?/, ')\\?')}$`,
  );
  const results = url.match(expression);

  if (!keys || !results) return { match: false, pattern, params: {} };

  const params = keys.reduce(
    (acc, key, idx) => Object.assign(acc, { [key]: results[idx + 1] }),
    {},
  );

  return { match: true, pattern, params };
}

const mocks = new Set<{
  method: Method;
  url: string;
  handler?: MockHandler;
}>();

type MockHandler = (options: {
  params: Record<string, unknown>;
}) => Record<string, unknown>;

const addHandler = (method: Method, url: string, handler?: MockHandler) => {
  mocks.add({ method, url, handler });
};

const getHandler = (method: Method, url: string) => {
  for (const mock of Array.from(mocks)) {
    if (mock.method.toLowerCase() !== method.toLowerCase()) continue;

    if (!match(mock.url, url).match) continue;
    return mock;
  }
};

// intercept the request to block the outbound call
axios.interceptors.request.use(
  (config) => {
    // don't use the mock when the user uses their own API keys.
    if (
      !String(config.headers['X-MAGICBELL-USER-EMAIL']).endsWith('@example.com')
    ) {
      return config;
    }

    const mock = getHandler(config.method, config.url);
    if (!mock) return config;

    const { params } = match(mock.url, config.url);
    const mockError = new Error();
    mockError['config'] = config;
    mockError['data'] = mock.handler
      ? mock.handler({ params: { ...params, ...config.params } })
      : { data: {} };
    return Promise.reject(mockError);
  },
  (error) => Promise.reject(error),
);

// intercept the response to return mock data
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error['data'] || !error['config']) return Promise.reject(error);

    const { data, config } = error;

    // Handle mocked error (any non-2xx status code)
    if (data.status && String(data.status)[0] !== '2') {
      const err = new Error(data.message || 'mock error');
      err['code'] = data.status;
      return Promise.reject(err);
    }

    return Promise.resolve({
      data: {},
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      isMock: true,
      ...data,
    });
  },
);

const notification = (data) => ({
  id: id('not'),
  title: 'Test Notification',
  content: 'Notification Content',
  action_url: '',
  category: 'announcement',
  sent_at: timeAgo(0),
  ...data,
  recipient: {
    id: id('usr'),
    email: 'person@example.com',
    ...data.recipient,
  },
});

const channelSettings = () => ({
  in_app: true,
  mobile_push: true,
  web_push: true,
  email: true,
});

addHandler('get', '/config');

addHandler('get', '/notifications', () => ({
  data: {
    project_id: id('prj'),
    unseen_count: 3,
    unread_count: 3,
    total: 1,
    total_pages: 1,
    per_page: 15,
    current_page: 1,
    notifications: [
      notification({
        title: `Welcome to MagicBell Playground! 🎉`,
        content: 'Here you can explore, and play with, our various web SDKs.',
        sent_at: timeAgo(60),
      }),
      notification({
        title: 'Make demos or reproductions. 👀',
        content:
          'Click the "Fork" button in the top right corner when you wish to save your changes. It will load the current playground - including all modifications - in CodeSandbox. The sandbox can then be easily shared with coworkers, or with us.',
        seen_at: timeAgo(0),
        sent_at: timeAgo(120),
      }),
      notification({
        title: 'Escape the Sandbox. 🚀',
        read_at: timeAgo(0),
        seen_at: timeAgo(0),
        sent_at: timeAgo(300),
        content: `You're currently looking at mock data. Working with your own production data, is possible by changing the API key and userEmail in the code editor.`,
      }),
    ],
    user: { email: 'person@example.com' },
  },
}));

addHandler('get', '/notification_preferences', () => ({
  data: {
    notification_preferences: {
      categories: {
        announcement: channelSettings(),
        billing: channelSettings(),
        mentions: channelSettings(),
      },
    },
  },
}));

addHandler('put', '/notification_preferences');
addHandler('post', '/notifications/read');
addHandler('post', '/notifications/seen');
addHandler('post', '/notifications/:id/read');
addHandler('post', '/notifications/:id/unread');
addHandler('delete', '/notifications/:id');
