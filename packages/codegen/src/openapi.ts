import parser from '@apidevtools/swagger-parser';
import axios from 'axios';
import fs from 'fs/promises';
import { OpenAPI } from 'openapi-types';

import { getByRef, getRequestBody, getResponseBody, isEmptySchema, ReferenceObject, SchemaObject } from './schema';
import { camelCase, pascalCase } from './text';

export async function getOpenAPIDocument(file: string, options = { dereference: true }) {
  const parse = options.dereference ? parser.dereference.bind(parser) : parser.parse.bind(parser);

  const contents = /https?:\/\//.test(file)
    ? await axios.get(file).then((x) => x.data)
    : await fs.readFile(file, 'utf-8').then((x) => JSON.parse(x));

  return parse(contents);
}

export function getRootPaths(document: OpenAPI.Document) {
  const paths = Object.keys(document.paths);
  const rootPaths = paths.map((x) => x.split('/').filter(Boolean)[0]);
  return Array.from(new Set(rootPaths));
}

export type Method = {
  entity: string;
  path: string;
  method: string;
  name: string;
  type?: string;
  beta: boolean;
  private: boolean;
  params?: SchemaObject[];
  data?: SchemaObject;
  returns?: SchemaObject;
} & OpenAPI.Operation;

export type Resource = {
  path: string;
  methods: Method[];
};

export function getRootPathMethods(document: OpenAPI.Document, path: string) {
  const methods: Array<Method> = [];
  const apiPaths = Object.keys(document.paths).filter((x) => x.startsWith(`/${path}`));

  // we're using "entity" to wrap data and unwrap response. We might want to improve this, and
  // decide whether and how to wrap/unwrap on the method level, instead of making the resource
  // level decide for the method.
  const body = getRequestBody(document.paths[`/${path}`].post) || getResponseBody(document.paths[`/${path}`].get);
  const entity = Object.keys(body.schema['properties'])[0];

  for (const apiPath of apiPaths) {
    const rootPath = apiPath.split('/').filter(Boolean)[0];

    for (const method of Object.keys(document.paths[apiPath])) {
      const operation = document.paths[apiPath][method];
      const resource = operation.operationId.slice(0, rootPath.length);
      const name = camelCase(operation.operationId.slice(rootPath.length + 1));
      const type = name === 'list' ? 'list' : null;

      // url params, are applied like notifications.get('id')
      const urlParams = (apiPath.match(/{\w+}/g) || []).map((param) => param.replace(/[{}]/g, ''));
      const params = urlParams.map((param) => {
        const source = operation.parameters.find((x) => x.in === 'path' && x.name === param);
        return {
          title: camelCase(param),
          description: source?.description,
          type: 'string',
          ...source?.schema,
        };
      });

      // data is applied after url params, in an object, like notifications.create({ title: 'hi' })
      const query = (operation.parameters || [])
        .filter((x) => x.in === 'query')
        .map((x) => ({
          title: camelCase(x.name),
          description: x.description,
          ...x.schema,
        }));

      // const requestOptions = operation.parameters?.filter((x) => x.in === 'header').map((x) => x.name) ?? [];
      const TypePrefix = pascalCase(name) + pascalCase(resource);

      const requestBody = getRequestBody(operation)?.schema;
      const data = query.length
        ? {
            title: TypePrefix + 'PayloadSchema',
            type: 'object',
            properties: query.reduce((acc, x) => ({ ...acc, [x.title]: x }), {}),
            additionalProperties: false,
            required: query.filter((x) => x.required).map((x) => x.title),
          }
        : {
            title: TypePrefix + 'PayloadSchema',
            type: 'object',
            ...getSchema(document, requestBody, { entity, excludeReadOnly: true }),
            additionalProperties: false,
          };

      const successResponse = getResponseBody(operation)?.schema;

      const returns = {
        title: TypePrefix + 'ResponseSchema',
        description: successResponse?.['description'],
        ...getSchema(document, successResponse, { entity }),
      };

      methods.push({
        name,
        entity,
        type,
        path: apiPath.replace(`/${path}`, '').replace(/^\//, ''),
        method,
        private: Boolean(operation['x-private']),
        beta: Boolean(operation['x-beta']),
        returns: isEmptySchema(returns) ? null : returns,
        params: params.filter((x) => !isEmptySchema(x)),
        data: isEmptySchema(data) ? null : data,
        ...operation,
      });
    }
  }

  return methods;
}

// TODO: move this out to the implementing side
function getSchema(
  doc: OpenAPI.Document,
  schema: SchemaObject | ReferenceObject,
  options: { entity: string; excludeReadOnly?: boolean },
) {
  if (!schema) return null;
  const maybeWrapped = '$ref' in schema ? getByRef(doc, schema.$ref) : schema;
  const unwrapped = maybeWrapped.properties?.[options.entity] || maybeWrapped;
  const objectSchema = '$ref' in unwrapped ? getByRef(doc, unwrapped.$ref) : unwrapped;

  if (!options.excludeReadOnly || !objectSchema.properties) return objectSchema;

  const copy = { ...objectSchema, properties: {} };
  for (const [key, value] of Object.entries(objectSchema.properties || {})) {
    if (value?.['readOnly'] === true) continue;
    copy.properties[key] = objectSchema.properties[key];
  }

  return copy;
}
