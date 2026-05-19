import * as path from 'path';
import { patchNestjsSwagger } from './patch-nest-swagger';

// Same absolute-path bypass as the patch (@nestjs/swagger 11.4.3+ exports map).
const loadSchemaObjectFactoryModule = () => {
  const pkgPath = require.resolve('@nestjs/swagger/package.json');
  const factoryPath = path.join(
    path.dirname(pkgPath),
    'dist',
    'services',
    'schema-object-factory'
  );
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(factoryPath) as typeof import('@nestjs/swagger/dist/services/schema-object-factory');
};

describe('patchNestjsSwagger', () => {
  it('loads SchemaObjectFactory and installs the patch with no arguments', () => {
    // Regression: @nestjs/swagger 11.4.3 "exports" map broke the deep require.
    expect(() => patchNestjsSwagger()).not.toThrow();

    const { SchemaObjectFactory } = loadSchemaObjectFactoryModule();
    expect(typeof SchemaObjectFactory.prototype.exploreModelSchema).toBe(
      'function'
    );
  });

  it('honours an explicitly-injected schemaObjectFactoryModule', () => {
    const injected = loadSchemaObjectFactoryModule();
    expect(() => patchNestjsSwagger(injected)).not.toThrow();
  });
});
