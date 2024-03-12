import * as path from 'path';
import { withCompilerOptions } from '.';
import ts from 'typescript';
import findConfig from 'find-config';
import { readFileSync } from 'fs';
import { isEmpty } from 'lodash';
import { transformItem } from './transform';
import { MyParser } from './MyParser';

export function parseComponentMeta(entry: string) {
  // const realPath = path.dirname(entry);
  let basePath = path.dirname(entry);
  let tsConfigPath = findConfig('tsconfig.json', { cwd: basePath }) ?? '';
  basePath = path.dirname(tsConfigPath ?? '');
  const { config, error } = ts.readConfigFile(tsConfigPath, filename =>
    readFileSync(filename, 'utf8')
  );
  const { options, errors } = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    basePath,
    {},
    tsConfigPath
  );

  const result = withCompilerOptions(options, {
    Parser: MyParser,
    skipChildrenPropWithoutDoc: false,
  }).parse(entry);
  const excludeTypes = [
    'HTMLAttributes',
    'LibraryManagedAttributes',
    'IntrinsicElements',
    'DOMAttributes',
    'AriaAttributes',
  ];
  const coms = result.reduce((res: any[], info: any) => {
    if (!info || !info.props || isEmpty(info.props)) return res;
    const props = Object.keys(info.props).reduce((acc: any[], name) => {
      // omit aria related properties temporarily
      if (name.startsWith('aria-')) {
        return acc;
      }
      if (
        info.props[name]?.parent?.name &&
        excludeTypes.includes(info.props[name].parent.name)
      ) {
        return acc;
      }

      try {
        const item: any = transformItem(name, info.props[name]);
        acc.push(item);
      } catch (e) {
        console.log(e);
      }
      return acc;
    }, []);

    res.push({
      componentName: info.displayName,
      props,
    });
    return res;
  }, []);

  return coms;
}
