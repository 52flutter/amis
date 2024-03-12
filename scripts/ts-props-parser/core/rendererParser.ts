import { isPlainObject } from 'lodash';

export function parseProps(props: any, comm: any) {
  const genConfig = (props as any)?._genConfig;
  let items: any = {};
  Object.keys(genConfig ?? {}).forEach(key => {
    items[key] = genConfig[key];
    if (
      isPlainObject(genConfig[key]) &&
      genConfig[key]?.schemaNode &&
      genConfig[key]?.id
    ) {
      items[key] = (props as any).render(key, genConfig[key]);
    }
  });
  Object.keys(props.onEvent ?? ({} as any)).forEach(key => {
    if (typeof key === 'string' && props.onEvent[key]?.actions?.length) {
      items[key] = comm.getHandleEvent(key);
    }
  });
  return items;
}
