#!/usr/bin/env zx
/* eslint-disable no-console */
import 'zx/globals';

import {
  builders as b,
  camelCase,
  capitalize,
  File,
  filterResourcesMethods,
  formatMarkdown,
  generateResourceFiles,
  getBetaMethods,
  getRequestBody,
  getResources,
  hasHeader,
  hyphenCase,
  Method,
  recast,
  Resource,
  schemaToObject,
  updateReadme,
} from '@magicbell/codegen';
import { builders } from 'ast-types';
import * as K from 'ast-types/gen/kinds';
import fs from 'fs/promises';
import { OpenAPIV3 } from 'openapi-types';
import path from 'path';

const SPEC_URL = argv.spec || process.env.SPEC_URL || 'https://public.magicbell.com/specs/openapi.json';

const initError = !argv.help && !argv.dest && !argv.docs;

if (initError) {
  console.error('Either --dest or --docs must be provided');
  argv.help = true;
}

if (argv.help) {
  console.log(`
Usage: generate-resources [options]

Options:
  --spec <url>    OpenAPI spec URL (default: https://public.magicbell.com/specs/openapi.json)
  --dest <dir>    Target directory for generated files
  --docs <file>   Target file for docs
`);

  process.exit(initError ? 1 : 0);
}

function cleanMarkdown(markdown = '') {
  return markdown.replace(/\[(.*)]\(.*\)/g, '$1');
}

function countChar(char: string, string: string): number {
  return string.split(char).length - 1;
}

function createResource(scope: 'user' | 'project', resource: Resource, children: Resource[]) {
  const clientFn = `get${capitalize(scope)}Client`;
  const hasBetaMethod = resource.methods.some((x) => x.beta);

  const exportName = camelCase((resource as any).name || resource.path);
  const commandName = hyphenCase(resource.path.split('/').pop());

  // child resource imports
  const imports = children?.map((x) => b.importDeclaration([camelCase((x as any).name)], `./${x.path}`)) || [];

  // createCommand(commandName);
  let command = builders.callExpression(b.id('createCommand'), [builders.stringLiteral(commandName)]);

  // command.description(...)
  command = builders.callExpression(builders.memberExpression(command, b.id('description')), [
    builders.stringLiteral(cleanMarkdown(resource.summary)),
  ]);

  const body: K.StatementKind[] = [];

  body.push(
    builders.exportNamedDeclaration(
      builders.variableDeclaration('const', [builders.variableDeclarator(b.id(exportName), command)]),
    ),
  );

  // subcommands
  // add `users.addCommand(usersNotifications);`
  for (const child of children) {
    body.push(
      builders.expressionStatement(
        builders.callExpression(builders.memberExpression(b.id(exportName), b.id('addCommand')), [
          b.id(camelCase((child as any).name)),
        ]),
      ),
    );
  }

  for (const method of resource.methods) {
    let expression: K.ExpressionKind = b.id(exportName);

    const hasData = Boolean(method.data);
    const isListMethod = method.name === 'list';

    // add command
    expression = builders.callExpression(builders.memberExpression(expression, b.id('command')), [
      builders.stringLiteral(hyphenCase(method.name)),
    ]);

    // add description
    const betaFlag = builders.callExpression(builders.memberExpression(b.id('kleur'), b.id('red')), [
      builders.stringLiteral('[BETA] '),
    ]);

    const description = builders.stringLiteral(cleanMarkdown(method.summary || method.description));

    expression = builders.callExpression(builders.memberExpression(expression, b.id('description')), [
      method.beta ? builders.binaryExpression('+', betaFlag, description) : description,
    ]);

    // add arguments
    for (const param of method.params) {
      expression = builders.callExpression(builders.memberExpression(expression, b.id('argument')), [
        builders.stringLiteral(`<${hyphenCase(param.title)}>`),
        builders.stringLiteral((cleanMarkdown(param.description) || '').split('\n')[0]),
      ]);
    }

    // add options
    for (const [option, schema] of Object.entries(method.data?.properties || {})) {
      const flag = `--${hyphenCase(option)}`;
      const type = schema.type === 'boolean' ? null : schema.type === 'array' ? `${schema.items.type}...` : schema.type;

      expression = builders.callExpression(builders.memberExpression(expression, b.id('option')), [
        builders.stringLiteral(type ? `${flag} <${type}>` : flag),
        builders.stringLiteral((cleanMarkdown(schema.description) || '').split('\n')[0]),
      ]);
    }

    // list methods get additional options
    if (isListMethod) {
      // .option('--paginate', '{description}')
      expression = builders.callExpression(builders.memberExpression(expression, b.id('option')), [
        builders.stringLiteral('--paginate'),
        builders.stringLiteral('Make additional HTTP requests to fetch all pages of results'),
      ]);

      // .option('--max-items <integer>', '{description}', Number)
      expression = builders.callExpression(builders.memberExpression(expression, b.id('option')), [
        builders.stringLiteral('--max-items <number>'),
        builders.stringLiteral('Maximum number of items to fetch'),
        builders.identifier('Number'),
      ]);
    }

    const methodNamespace = resource.path
      .split('/')
      .map((x) => camelCase(x))
      .join('.');

    // add action
    expression = builders.callExpression(builders.memberExpression(expression, b.id('action')), [
      builders.arrowFunctionExpression.from({
        async: true,
        params: [
          ...method.params.map((x) => b.id(camelCase(x.title))),
          isListMethod
            ? builders.objectPattern([
                b.objectProperty('paginate'),
                b.objectProperty('maxItems'),
                builders.restProperty(b.id('opts')),
              ])
            : b.id('opts'),
          b.id('cmd'),
        ],
        body: builders.blockStatement([
          builders.variableDeclaration('const', [
            builders.variableDeclarator(
              builders.objectPattern(
                [hasData && b.objectProperty('data'), b.objectProperty('options')].filter(Boolean),
              ),
              builders.callExpression(b.id('parseOptions'), [b.id('opts')]),
            ),
          ]),
          ...(isListMethod
            ? [
                // const list = getClient().<resource>.list(<...params>, <data>, <options>);
                builders.variableDeclaration('const', [
                  builders.variableDeclarator(
                    b.id('response'),
                    builders.callExpression(
                      builders.memberExpression(
                        builders.memberExpression(
                          builders.callExpression(b.id('getClient'), [b.id('cmd')]),
                          b.id(methodNamespace),
                        ),
                        b.id(camelCase(method.name)),
                      ),
                      [
                        ...method.params.map((x) => b.id(camelCase(x.title))),
                        hasData && b.id('data'),
                        b.id('options'),
                      ].filter(Boolean),
                    ),
                  ),
                ]),
                builders.ifStatement(
                  b.id('paginate'),
                  // if (paginate) { await response.forEach(notification => printJson(notification)) }
                  builders.blockStatement([
                    builders.expressionStatement(
                      builders.awaitExpression(
                        builders.callExpression(builders.memberExpression(b.id('response'), b.id('forEach')), [
                          builders.arrowFunctionExpression(
                            [b.id('notification'), b.id('idx')],
                            builders.blockStatement([
                              // printJSON(notification);
                              builders.expressionStatement(
                                builders.callExpression(b.id('printJson'), [b.id('notification')]),
                              ),
                              // return !(maxItems && idx + 1 >= maxItems)
                              builders.returnStatement(
                                builders.unaryExpression(
                                  '!',
                                  builders.logicalExpression(
                                    '&&',
                                    b.id('maxItems'),
                                    builders.binaryExpression(
                                      '>=',
                                      builders.binaryExpression('+', b.id('idx'), builders.numericLiteral(1)),
                                      b.id('maxItems'),
                                    ),
                                  ),
                                ),
                              ),
                            ]),
                          ),
                        ]),
                      ),
                    ),
                  ]),
                  // else { await response.then(result => printJson(result)) }
                  builders.blockStatement([
                    builders.expressionStatement(
                      builders.awaitExpression(
                        builders.callExpression(builders.memberExpression(b.id('response'), b.id('then')), [
                          builders.arrowFunctionExpression(
                            [b.id('result')],
                            builders.callExpression(b.id('printJson'), [b.id('result')]),
                          ),
                        ]),
                      ),
                    ),
                  ]),
                ),
              ]
            : [
                // const response = await client.<resource>.<method>(< ...params>, <data>, <options>);
                builders.variableDeclaration('const', [
                  builders.variableDeclarator(
                    b.id('response'),
                    builders.awaitExpression(
                      builders.callExpression(
                        builders.memberExpression(
                          builders.memberExpression(
                            builders.callExpression(b.id('getClient'), [b.id('cmd')]),
                            b.id(methodNamespace),
                          ),
                          b.id(camelCase(method.name)),
                        ),
                        [
                          ...method.params.map((x) => b.id(camelCase(x.title))),
                          hasData && b.id('data'),
                          b.id('options'),
                        ].filter(Boolean),
                      ),
                    ),
                  ),
                ]),
                // printJSON(response);
                builders.expressionStatement(builders.callExpression(b.id('printJson'), [b.id('response')])),
              ]),
        ]),
      }),
    ]);

    body.push(builders.expressionStatement(expression));
  }

  const dots = '../'.repeat(countChar('/', resource.path) + 1).replace(/\/$/, '');

  const ast = builders.program.from({
    comments: [
      builders.commentLine.from({
        value: ' This file is generated. Do not update manually!\n',
      }),
    ],
    body: [
      hasBetaMethod && b.importDeclaration('kleur', 'kleur'),
      b.importDeclaration([`${clientFn} as getClient`], `${dots}/lib/client`),
      b.importDeclaration(['createCommand'], `${dots}/lib/commands`),
      b.importDeclaration(['parseOptions'], `${dots}/lib/options`),
      b.importDeclaration(['printJson'], `${dots}/lib/printer`),
      ...imports,
      ...body,
    ].filter(Boolean),
  });

  return recast.print(ast);
}

function createDocs(resource: Resource) {
  const lines: Array<string> = [];
  const startLevel = 3;

  lines.push(`${'#'.repeat(startLevel)} ${capitalize(resource.path.replaceAll('/', ' '))}\n`);

  for (const method of resource.methods) {
    // don't document private methods
    if (method.private) continue;

    const parameters = method.parameters as OpenAPIV3.ParameterObject[];
    const requiresUserEmail = parameters.some((x) => /x-magicbell-user-email/i.test(x.name));
    const pathParams = method.params.map((x) => `<${hyphenCase(x.title)}>`);
    const requestBody = getRequestBody(method);

    const options = [];
    if (requiresUserEmail) {
      options.push(['user-email', 'person@example.com']);
    }

    const note = method.beta
      ? `
> **Warning**
>
> This method is in preview and is subject to change.
`.trim()
      : '';

    function normalizeOption(key, value) {
      if (key === 'recipients') value = value.map((x) => x.email || x.external_id).filter(Boolean)[0];
      if (value == null) return;
      if (Array.isArray(value)) value = value[0];
      if (typeof value === 'object') value = JSON.stringify(value);

      if (typeof value !== 'string') return `--${key} ${value}`;

      // some example objects are compacted using ..., we can't use them here
      if (value.includes('…') || value.includes('...')) return;

      value = value.replaceAll("'", "\\'");
      return `--${hyphenCase(key)} '${value}'`;
    }

    const bodyObject = requestBody?.example || schemaToObject(requestBody?.schema);
    const bodyFlags = Object.entries(bodyObject?.[method.entity] || bodyObject || {}).map(([key, value]) =>
      normalizeOption(key, value),
    );

    const optionsFlags =
      method.data && !bodyFlags
        ? Object.entries(schemaToObject(method.data)).map(([key, value]) => normalizeOption(key, value))
        : [];

    const flags = [...pathParams, ...optionsFlags, ...bodyFlags.map((x) => ` \\\n  ${x}`)].filter(Boolean).join(' ');

    const methodNamespace = resource.path
      .split('/')
      .map((x) => hyphenCase(x))
      .join(' ');

    lines.push(
      `
${'#'.repeat(startLevel + 1)} ${method.summary}

${note}

${method.description || ''}

\`\`\`shell
magicbell ${methodNamespace} ${hyphenCase(method.name)} ${flags}
\`\`\`
`.trim() + '\n',
    );
  }

  return formatMarkdown(lines.join('\n'));
}

async function updateFeatureFlags(filePath: string, betaMethods: Method[]) {
  const source = await fs.readFile(filePath, 'utf-8');
  const ast = recast.parse(source);
  const program = ast.program;

  // find `const features: ClientOptions['features'] = {};`
  const features = program.body.find(
    (x) => x.type === 'VariableDeclaration' && x.declarations[0].id.name === 'features',
  );

  // update features to be an object with the beta methods
  features.declarations[0].init = builders.objectExpression(
    betaMethods.map((method) =>
      builders.property('init', builders.stringLiteral(method.operationId), builders.booleanLiteral(true)),
    ),
  );

  const output = await recast.print(ast, false);

  if (!output) return;
  await fs.writeFile(filePath, output, 'utf-8');
}

async function createResourceIndex(resources: Resource[]) {
  const ast = builders.program([
    ...resources.map((resource) =>
      builders.exportAllDeclaration(builders.stringLiteral(`./${hyphenCase(resource.path)}`), null),
    ),
  ]);

  return recast.print(ast);
}

async function main() {
  const resources = await getResources(SPEC_URL);

  const projectResources = filterResourcesMethods(resources, (method) =>
    hasHeader(method, { name: 'x-magicbell-api-secret', required: true }),
  );

  const userResources = filterResourcesMethods(
    resources,
    (method) => !hasHeader(method, { name: 'x-magicbell-api-secret', required: true }),
  );

  const betaMethods = getBetaMethods(resources);

  const files: Array<File> = [];

  // generate ast for new resource files
  const [projectResourceFiles, userResourceFiles] = await Promise.all([
    generateResourceFiles(
      projectResources,
      'project-resources',
      (r, c) => createResource('project', r, c),
      (r) => createDocs(r),
    ),
    generateResourceFiles(
      userResources,
      'user-resources',
      (r, c) => createResource('user', r, c),
      (r) => createDocs({ ...r, path: `user/${r.path}` }),
    ),
  ]);

  files.push(...projectResourceFiles, ...userResourceFiles);
  files.push({ name: 'project-resources/index.ts', source: await createResourceIndex(projectResources) });
  files.push({ name: 'user-resources/index.ts', source: await createResourceIndex(userResources) });

  const outDirs = Array.from(new Set(files.map((x) => path.dirname(x.name))));

  // add readme - this should not go through eslint
  outDirs.forEach((dir) => {
    files.push({
      name: path.join(dir, 'README.md'),
      source: 'Files in this directory are auto generated. Do not make any manual changes within this directory.\n',
    });
  });

  if (argv.dest) {
    // all files are generated & linted, now it makes sense to flush the old files and write new ones
    for (const dir of outDirs) {
      await fs.rm(path.join(argv.dest, dir), { recursive: true }).catch(() => void 0);
      await fs.mkdir(path.join(argv.dest, dir), { recursive: true });
    }

    for (const file of files) {
      const outFile = path.join(argv.dest, file.name);
      await fs.mkdir(path.dirname(outFile), { recursive: true });
      await fs.writeFile(outFile, file.source || '', 'utf-8');
      console.log(`generated ${path.relative(process.cwd(), outFile)}`);
    }

    // update feature flags
    await updateFeatureFlags(path.join(process.cwd(), argv.dest, 'lib/client.ts'), betaMethods);
  }

  if (argv.docs) {
    // update method docs in readme
    await updateReadme(argv.docs, 'PROJECT_RESOURCE_METHODS', projectResourceFiles.map((x) => x.docs).filter(Boolean));
    await updateReadme(argv.docs, 'USER_RESOURCE_METHODS', userResourceFiles.map((x) => x.docs).filter(Boolean));
    console.log(`updated ${argv.docs}`);
  }
}

main();
