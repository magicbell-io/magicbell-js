import { isArray, isBoolean, isObject, isString } from '../lib/utils';
import { isOptionsHash } from './options';
import { ClientOptions, RequestMethod } from './types';

type KeyOfType<T, V> = keyof {
  [P in keyof T as T[P] extends V ? P : never]: any;
};

export type IterablePromise<
  TData,
  TKey extends KeyOfType<TData, Array<unknown>> = KeyOfType<TData, Array<unknown>>,
  TNode = TData[TKey] extends Array<unknown> ? TData[TKey][number] : never,
> = Promise<TData> & {
  [Symbol.asyncIterator](): Iterator<TNode>;
  forEach(cb: (node: TNode, index: number) => void | boolean | Promise<void | boolean>): Promise<void>;
  toArray(options: { limit: number }): Promise<Array<TNode>>;
};

const queryParamValidators = {
  archived: isBoolean,
  read: isBoolean,
  seen: isBoolean,
  category: isString,
  topic: isString,
};

function isForcedQueryParams(object) {
  if (!isObject(object)) return false;

  for (const key of Object.keys(object)) {
    if (!queryParamValidators[key]?.(object[key])) return false;
  }

  return true;
}

function getUrl(path: string, params: Record<string, string>, options = { encode: true }) {
  return path.replace(/{([\s\S]+?)}/g, (_, $1) =>
    options.encode ? encodeURIComponent(params[$1] || '') : params[$1] || '',
  );
}

function extractUrlParams(path: string) {
  const params = path.match(/{\w+}/g) || [];
  return (params || []).map((param) => param.replace(/[{}]/g, ''));
}

/**
 * Return the data argument from a list of arguments
 *
 * @param {object[]} args
 * @returns {object}
 */
function getDataFromArgs(args): Record<string, unknown> {
  if (!isArray(args) || !isObject(args[0])) return {};
  if (isOptionsHash(args[0])) return {};
  return args.shift();
}

/**
 * Return the options hash from a list of arguments
 */
function getOptionsFromArgs(args): Partial<ClientOptions> {
  if (!isArray(args) || args.length === 0) return {};

  const arg = args[args.length - 1];
  if (!isOptionsHash(arg)) return {};

  return { ...args.pop() };
}

export function normalizeArgs({
  path,
  method,
  args,
}: {
  path: string;
  method: RequestMethod;
  args: (Record<string, unknown> | string)[];
}) {
  const argsCopy = [...args].filter((x) => x !== undefined);

  const urlParams = extractUrlParams(path);
  const urlData = urlParams.reduce((urlData, param) => {
    const arg = argsCopy.shift();
    if (typeof arg !== 'string') {
      throw new Error(
        `MagicBell: Argument "${param}" must be a string, but got ${typeof arg}: ${JSON.stringify(
          arg,
        )} (on API request to \`${method} ${path}\`)`,
      );
    }

    urlData[param] = arg;
    return urlData;
  }, {});

  // We don't encode atm because the backend doesn't support that in PUT /users/email:user@domain.com
  const url = getUrl(path, urlData, { encode: false });
  const dataFromArgs = getDataFromArgs(argsCopy);
  const options = getOptionsFromArgs(argsCopy);

  // Validate that there are no more args.
  if (argsCopy.filter((x) => x != null).length) {
    throw new Error(
      `MagicBell: Unknown arguments (${JSON.stringify(argsCopy)}). (on API request to \`${method} ${url}\`)`,
    );
  }

  // Note, DELETE requests should have data in the params, but our `subscriptions.delete`
  //   endpoint reads it from the body. Other delete requests don't have data, so this seems
  //   to be the best solution for now.
  let dataInQuery = method === 'GET'; // || method === 'DELETE';

  // We have a few POST methods using query data instead of body data.
  if (method === 'POST' && isForcedQueryParams(dataFromArgs)) {
    dataInQuery = true;
  }

  const data = dataInQuery ? {} : dataFromArgs;
  const params = dataInQuery ? dataFromArgs : {};

  return { path: url, data, params, options };
}
