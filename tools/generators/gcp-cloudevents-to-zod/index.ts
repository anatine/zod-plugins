import { JSONSchema } from './../../../node_modules/@apidevtools/json-schema-ref-parser/lib/index.d';
import {
  Tree,
  formatFiles,
  installPackagesTask,
  generateFiles,
  joinPathFragments,
  readProjectConfiguration,
  logger,
  runExecutor,
  readJsonFile,
} from '@nrwl/devkit';
import { libraryGenerator } from '@nrwl/workspace/generators';
import { exec } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import {
  jsonSchemaToZod,
  jsonSchemaToZodDereffed,
  parseSchema,
} from 'json-schema-to-zod';
import toJsonSchema from '@openapi-contrib/openapi-schema-to-json-schema';
import $RefParser from '@apidevtools/json-schema-ref-parser';

async function getFileList(dirName: string) {
  let files: string[] = [];
  const items = await readdir(dirName, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      files = [...files, ...(await getFileList(`${dirName}/${item.name}`))];
    } else {
      files.push(`${dirName}/${item.name}`);
    }
  }
  return files;
}

function asyncExec(
  command: string,
  { log = false, cwd = process.cwd() }: { log?: boolean; cwd?: string } = {
    log: false,
    cwd: process.cwd(),
  }
): Promise<string> {
  if (log) logger.log(command);

  return new Promise((done, failed) => {
    exec(command, { cwd }, (err, output) => {
      if (err) {
        logger.error('could not execute: ' + command);
        logger.error(err);
        failed(err);
        return;
      }

      done(output);
    });
  });
}

export interface GeneratorOptions {
  name: string;
  clone?: boolean;
  repository?: string;
}

export default async function (tree: Tree, schema: GeneratorOptions) {
  const clone = schema.clone === undefined ? true : schema.clone;
  const repository = schema.repository ?? './tmp/google-cloudevents';

  // Check to see if the './tmp/google-cloudevents/.git' directory exists
  // If it does, then we can assume that the repository has already been cloned
  // If it does not, then we can assume that the repository has not been cloned
  // and we should clone it
  if (clone && !tree.exists(`${repository}/.git`)) {
    logger.info(`Git repository "google-cloudevents" does not exist.`);
    logger.info(`Cloning repository google-cloudevents to "${repository}"`);

    await asyncExec(
      `git clone --depth 1 --branch main --no-checkout https://github.com/googleapis/google-cloudevents.git ${repository}`
    ).then((stdout) => logger.log(stdout));
    await asyncExec(`git sparse-checkout set jsonschema`, {
      cwd: repository,
    }).then((stdout) => logger.log(stdout));
    await asyncExec(`git checkout main`, {
      cwd: repository,
    }).then((stdout) => logger.log(stdout));
  } else if (clone) {
    logger.info(`Git repository "google-cloudevents" already exists.`);
    logger.info(`Updating repository ${repository}`);
    await asyncExec(`git pull`, {
      cwd: repository,
    }).then((stdout) => logger.log(stdout));
  }

  await libraryGenerator(tree, { name: schema.name });
  const libraryRoot = readProjectConfiguration(tree, schema.name).root;
  tree.delete(joinPathFragments(libraryRoot, `src/lib/${schema.name}.ts`));
  tree.delete(joinPathFragments(libraryRoot, `src/lib/${schema.name}.spec.ts`));

  const fileList = await getFileList(`${repository}/jsonschema`);
  // take the the first 10 files for testing
  const tempList = fileList.slice(11, 13);
  // Async loop through the tempList
  for (const file of tempList) {
    // If a file doesn't end with .json, then skip it
    if (!file.endsWith('.json')) continue;

    logger.log(`Generating Zod Schema for ${file}`);
    // Read the JSON file from the filesystem

    // Get the filename without the path or extension
    const filename = file.split('/').pop()?.split('.')[0];

    // Get the path relative to the repository root using the repository string variable
    const treeFilePath = file
      .replace(`${repository}/jsonschema`, '')
      .replace(`/${filename}.json`, `/${filename}.ts`);

    // Remove all non-alphanumeric characters from the filename
    const name = filename?.replace(/[^a-zA-Z0-9]/g, '');

    const jsonSchema = readJsonFile(file);
    // logger.log(jsonSchema);
    if (jsonSchema.$ref) {
      // Currently top level $ref is not supported
      const refKeyName = jsonSchema.$ref.split('/').pop();
      delete jsonSchema.$ref;
      jsonSchema.properties = {
        ...jsonSchema.definitions[refKeyName].properties,
      };
      delete jsonSchema.definitions[refKeyName];
    }
    jsonSchema.type = jsonSchema.type || 'object';

    // Parse the JSON Schema
    const module = await jsonSchemaToZodDereffed(
      jsonSchema,
      jsonSchema.name ?? name,
      true
    );

    tree.write(
      joinPathFragments(libraryRoot, `src/lib/${treeFilePath}`),
      `export const zodFirebase = 'zodFirebase';`
    );
  }

  // tree.write(
  //   joinPathFragments(libraryRoot, 'src/lib/zod-firebase.ts'),
  //   `export const zodFirebase = 'zodFirebase';`
  // );
  // const data = tree
  //   .read(joinPathFragments(libraryRoot, 'src/index.ts'))
  //   ?.toString();
  // logger.debug(data);

  await formatFiles(tree);
  return () => {
    // logger.debug('Post-Run Hook Ran');
    // installPackagesTask(tree);
  };
}

/*

import { Tree, visitNotIgnoredFiles } from '@nrwl/devkit';
import { applyTransform } from 'jscodeshift/src/testUtils';
import arrowFunctionsTransform from './arrow-functions';

// The schema path can be an individual file or a directory
export default async function (tree: Tree, schema: { path: string }): any {
  visitNotIgnoredFiles(tree, schema.path, (filePath) => {
    const input = tree.read(filePath).toString();
    const transformOptions = {};
    const output = applyTransform(
      { default: arrowFunctionsTransform, parser: 'ts' },
      transformOptions,
      { source: input, path: filePath }
    );
    tree.write(filePath, output);
  });
}

*/
