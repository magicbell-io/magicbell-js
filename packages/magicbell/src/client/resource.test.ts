import { mockHandlers, setupMockServer } from '@magicbell/utils';
import { MockedRequest } from 'msw';

import { Client } from './client';
import { ASYNC_ITERATOR_SYMBOL } from './paginate';
import { Resource } from './resource';
import { RequestOptions } from './types';

const server = setupMockServer(...mockHandlers);

function pagedResponse({ total_pages, per_page }: { total_pages: number; per_page: number }) {
  return (req: MockedRequest) => {
    const page = Number(req.url.searchParams.get('page') || 1);
    return {
      total_pages,
      per_page,
      current_page: page,
      page: 1,
      fakes: Array.from({ length: per_page }).map((_, idx) => ({ id: (page - 1) * per_page + idx + 1 })),
    };
  };
}

class FakeResource extends Resource {
  path = 'fakes';
  entity = 'fake';

  get(id: string, options?: RequestOptions) {
    return this.request({ method: 'GET', path: '{id}' }, id, options);
  }

  getNested(id: string, name: string, options?: RequestOptions) {
    return this.request({ method: 'GET', path: '/box/{id}/with/{name}' }, id, name, options);
  }

  getList(options?: RequestOptions) {
    return this.request({ method: 'GET', paged: true }, options);
  }

  post(data: any, options?: RequestOptions) {
    return this.request({ method: 'POST' }, data, options);
  }

  betaMethod(id: string, options?: RequestOptions) {
    this.assertFeatureFlag('fake-beta-method');
    return this.request({ method: 'GET', path: '{id}' }, id, options);
  }
}

const client = new Client({
  host: 'https://example.com',
  apiKey: 'my-api-key',
});

const fakeResource = new FakeResource(client);

test('path parameters are replaced with their values', async () => {
  const spy = server.intercept('all');

  await fakeResource.get('obj-1');
  expect(spy.lastRequest.url.pathname).toEqual('/fakes/obj-1');

  await fakeResource.get('obj-2');
  expect(spy.lastRequest.url.pathname).toEqual('/fakes/obj-2');

  await fakeResource.getNested('obj-3', 'field-1');
  expect(spy.lastRequest.url.pathname).toEqual('/fakes/box/obj-3/with/field-1');
});

test('methods transparently add and remove wrapping entity names', async () => {
  const node = { id: '1', name: 'obj-1' };
  const spy = server.intercept('all', () => ({
    status: 200,
    json: { fake: node },
  }));

  const result = await fakeResource.post(node);

  const requestBody = await spy.lastRequest.json();
  const responseBody = await spy.lastResponse.json();
  expect(requestBody).toEqual({ fake: node });
  expect(responseBody).toEqual({ fake: node });
  expect(result).toEqual(node);
});

test('methods do not remove wrapping entity if errors are returned', async () => {
  const spy = server.intercept('all', () => ({
    status: 200,
    json: { errors: [{ message: 'oh noes' }] },
  }));

  const result = await fakeResource.post({ name: 'err' });

  expect(result).toEqual({ errors: [{ message: 'oh noes' }] });
  expect(result).toEqual(await spy.lastResponse.json());
});

test('methods can override client options', async () => {
  const spy = server.intercept('all', () => ({}));

  await fakeResource.get('obj-1', { userEmail: 'someone@example.com' });
  expect(spy.lastRequest.headers.get('x-magicbell-user-email')).toEqual('someone@example.com');
});

test('methods throw an error when unknown arguments are provided', async () => {
  // @ts-expect-error testing invalid options
  expect(() => fakeResource.get('obj-1', 'invalid')).toThrow(
    'MagicBell: Unknown arguments (["invalid"]). (on API request to `GET /fakes/obj-1`)',
  );
});

test('methods are able to detect filter arguments, and move them to query args', async () => {
  const spy = server.intercept('all');

  await fakeResource.post({ read: true, seen: true });
  expect(spy.lastRequest.url.searchParams.get('read')).toEqual('true');
  expect(spy.lastRequest.url.searchParams.get('seen')).toEqual('true');
});

test('methods dont put categories and topics in query params if they hold objects', async () => {
  const spy = server.intercept('all');

  await fakeResource.post({ categories: [{ slug: 'comments' }] });
  expect(await spy.lastRequest.json()).toEqual({ fake: { categories: [{ slug: 'comments' }] } });
  expect(spy.lastRequest.url.search).toEqual('');

  await fakeResource.post({ topics: [{ slug: 'issue.3' }] });
  expect(await spy.lastRequest.json()).toEqual({ fake: { topics: [{ slug: 'issue.3' }] } });
  expect(spy.lastRequest.url.search).toEqual('');

  await fakeResource.post({ category: 'comments' });
  expect(await spy.lastRequest.text()).toEqual('');
  expect(spy.lastRequest.url.search).toEqual('?category=comments');

  await fakeResource.post({ topic: 'issue.3' });
  expect(await spy.lastRequest.text()).toEqual('');
  expect(spy.lastRequest.url.search).toEqual('?topic=issue.3');
});

test('single resource methods are not iterable', async () => {
  const result = await fakeResource.post({ id: '1', name: 'obj-1' });

  expect(result[ASYNC_ITERATOR_SYMBOL]).toBeUndefined();
  expect(result).not.toHaveProperty('forEach');
  expect(result).not.toHaveProperty('toArray');
});

test('list methods are iterable and get pagination helpers', async () => {
  const iterator = fakeResource.getList();

  expect(typeof iterator[ASYNC_ITERATOR_SYMBOL]).toEqual('function');
  expect(iterator).toHaveProperty('forEach');
  expect(iterator).toHaveProperty('toArray');
});

test('list methods are awaitable to obtain a single page result', async () => {
  const data = { page: 1, fakes: [{ id: 1 }, { id: 2 }] };
  server.intercept('all', () => data);

  const result = await fakeResource.getList();

  expect(result).toEqual(data);
});

test('list methods are iterable over single nodes, and auto fetch next pages', async () => {
  server.intercept('all', pagedResponse({ total_pages: 4, per_page: 2 }));

  let counter = 0;
  for await (const node of fakeResource.getList()) {
    expect(node).toHaveProperty('id', ++counter);
  }

  expect(counter).toEqual(8);
});

test('list methods have a forEach helper which iterates over single nodes, and auto fetch next pages', async () => {
  server.intercept('all', pagedResponse({ total_pages: 4, per_page: 2 }));

  let counter = 0;
  await fakeResource.getList().forEach((node, idx) => {
    expect(idx).toEqual(counter++);
    expect(node).toHaveProperty('id', idx + 1);
  });

  expect(counter).toEqual(8);
});

test('forEach stops iterating when returning false', async () => {
  const spy = server.intercept('all', pagedResponse({ total_pages: 4, per_page: 2 }));

  const nodes = [];
  await fakeResource.getList().forEach((item, idx) => {
    nodes.push(item);
    if (idx === 4) return false;
  });

  expect(nodes).toHaveLength(5);
  expect(spy.handledRequests).toEqual(3);
});

test('list methods have a toArray helper which collects all nodes while auto fetching next pages', async () => {
  server.intercept('all', pagedResponse({ total_pages: 4, per_page: 2 }));

  const nodes = await fakeResource.getList().toArray({ limit: 1000 });
  expect(nodes).toHaveLength(8);

  nodes.forEach((node, idx) => {
    expect(node).toHaveProperty('id', idx + 1);
  });
});

test('the toArray helper requires a reasonable limit to be provided to guard for out-of-memory', async () => {
  // @ts-expect-error - we're testing the case where the limit is not provided
  expect(() => fakeResource.getList().toArray()).toThrow(/you must pass a `limit` option to toArray/i);
  expect(() => fakeResource.getList().toArray({ limit: 100_000 })).toThrow(
    /you cannot specify a limit of more than 10,000 items/i,
  );
});

test('toArray stops fetching when limit is reached', async () => {
  const spy = server.intercept('all', pagedResponse({ total_pages: 4, per_page: 2 }));

  const nodes = await fakeResource.getList().toArray({ limit: 5 });
  expect(nodes).toHaveLength(5);
  expect(spy.handledRequests).toEqual(3);
});

test('beta method throws when used without feature flag', () => {
  expect(() => fakeResource.betaMethod('n/a')).toThrow(
    'This is a beta feature, please enable it by providing the "fake-beta-method" feature flag.',
  );
});

test('beta method throws when used with wrong feature flag', async () => {
  const betaClient = new Client({
    host: 'https://example.com',
    apiKey: 'my-api-key',
    features: {
      // @ts-expect-error this flag doesn't exist
      'fake-beta-method-does-not-exist': true,
    },
  });

  const fakeResource = new FakeResource(betaClient);
  expect(() => fakeResource.betaMethod('n/a')).toThrow(
    'This is a beta feature, please enable it by providing the "fake-beta-method" feature flag.',
  );
});

test('beta method can be enabled via feature flags', async () => {
  const spy = server.intercept('all');

  const betaClient = new Client({
    host: 'https://example.com',
    apiKey: 'my-api-key',
    features: {
      // @ts-expect-error this flag doesn't exist
      'fake-beta-method': true,
    },
  });

  const fakeResource = new FakeResource(betaClient);
  await fakeResource.betaMethod('obj-1');
  expect(spy.lastRequest.url.pathname).toEqual('/fakes/obj-1');
});
