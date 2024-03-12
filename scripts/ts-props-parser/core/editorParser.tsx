import './MixedSetter';
import { isExpression } from 'amis-core';
import {
  BaseEventContext,
  BasePlugin,
  RendererPluginEvent,
  getSchemaTpl,
} from 'amis-editor-core';
import { IPropItem } from './types';
import { getLabel } from './utils';

export function toAmis(
  context: { eventCtx: BaseEventContext; plugin: BasePlugin },
  props: IPropItem[],
  prefix = ['_genConfig'],
  opts: { valueFormula: boolean } = { valueFormula: true }
) {
  const valueFormula = opts?.valueFormula ?? false;
  const map: Record<string, (node: IPropItem) => any> = {
    StringSetter: (node: IPropItem) => {
      return valueFormula
        ? getSchemaTpl('valueFormula', {
            mode: 'vertical',
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            required: node.setter.isRequired,
            rendererSchema: { type: 'input-text' },
            needDeleteProps: [node.name], // 避免自我限制
            label: getLabel(node),
            valueType: 'string',
            value: !node.setter.initialValue
              ? undefined
              : node.setter.initialValue,
          })
        : {
            type: 'input-text',
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            label: getLabel(node),
            required: node.setter.isRequired,
            value: !node.setter.initialValue
              ? undefined
              : node.setter.initialValue,
          };
    },
    NumberSetter: (node: IPropItem) => {
      return valueFormula
        ? getSchemaTpl('valueFormula', {
            mode: 'vertical',
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            required: node.setter.isRequired,
            rendererSchema: { type: 'input-number' },
            needDeleteProps: [node.name], // 避免自我限制
            label: getLabel(node),
            valueType: 'number',
            value: !node.setter.initialValue
              ? undefined
              : node.setter.initialValue,
          })
        : {
            type: 'input-number',
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            label: getLabel(node),
            required: node.setter.isRequired,
            value: !node.setter.initialValue
              ? undefined
              : node.setter.initialValue,
          };
    },
    BoolSetter: (node: IPropItem) => {
      return valueFormula
        ? getSchemaTpl('valueFormula', {
            mode: 'vertical',
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            needDeleteProps: ['option'],
            required: node.setter.isRequired,
            rendererSchema: { type: 'switch' },
            label: getLabel(node),
            rendererWrapper: true, // 浅色线框包裹一下，增加边界感
            // valueType: 'boolean',
            pipeIn: (value: any, data: any) => {
              const { trueValue = true, falseValue = false } = data.data || {};
              return value === trueValue
                ? true
                : value === falseValue
                ? false
                : value;
            },
            pipeOut: (value: any, origin: any, data: any) => {
              // 如果是表达式，直接返回
              if (isExpression(value)) return value;
              const { trueValue = true, falseValue = false } = data || {};
              return value ? trueValue : falseValue;
            },
          })
        : {
            type: 'switch',
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            label: getLabel(node),
            required: node.setter.isRequired,
            value: node.setter.initialValue,
          };
    },
    SelectSetter: (node: IPropItem) => {
      return valueFormula
        ? getSchemaTpl('valueFormula', {
            mode: 'vertical',
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            needDeleteProps: ['option'],
            required: node.setter.isRequired,
            rendererSchema: {
              type: 'select',
              value: node.setter.initialValue,
              options: node.setter.props?.options,
            },
            label: getLabel(node),
            rendererWrapper: true, // 浅色线框包裹一下，增加边界感
            // valueType: 'boolean',
            // pipeIn: (value: any, data: any) => {
            //   const { trueValue = true, falseValue = false } = data.data || {};
            //   return value === trueValue
            //     ? true
            //     : value === falseValue
            //     ? false
            //     : value;
            // },
            // pipeOut: (value: any, origin: any, data: any) => {
            //   // 如果是表达式，直接返回
            //   if (isExpression(value)) return value;
            //   const { trueValue = true, falseValue = false } = data || {};
            //   return value ? trueValue : falseValue;
            // },
          })
        : {
            type: 'select',
            value: node.setter.initialValue,
            options: node.setter.props?.options,
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            label: getLabel(node),
            required: node.setter.isRequired,
          };
    },
    RadioGroupSetter: (node: IPropItem) => {
      return valueFormula
        ? getSchemaTpl('valueFormula', {
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            needDeleteProps: ['option'],
            mode: 'vertical',
            required: node.setter.isRequired,
            rendererSchema: (schema: any) => {
              return {
                ...schema,
                type: 'button-group-select',
                value: node.setter.initialValue,
                options: node.setter.props?.options,
              };
            },
            label: getLabel(node),
            rendererWrapper: true, // 浅色线框包裹一下，增加边界感
          })
        : {
            type: 'button-group-select',
            value: node.setter.initialValue,
            options: node.setter.props?.options,
            name: node.name ? prefix.concat(node.name).join('.') : undefined,
            label: getLabel(node),
            required: node.setter.isRequired,
          };

      // ObjectSetter
      // ArraySetter
      // ColorSetter
      // MixedSetter
      // FunctionSetter
    },
    ColorSetter: (node: IPropItem) => {
      return {
        name: node.name ? prefix.concat(node.name).join('.') : undefined,
        value: node.setter.initialValue,
        type: 'input-color',
        mode: 'vertical',
        required: node.setter.isRequired,
        label: getLabel(node),
      };
    },
    ObjectSetter: (node: IPropItem) => {
      return getSchemaTpl('collapseGroup', [
        {
          title: getLabel(node),
          body: [
            ...toAmis(
              context,
              node.setter.props?.config?.items,
              node.name ? prefix.concat(node.name) : [],
              opts
            ),
          ],
        },
      ]);
    },
    ArraySetter: (node: IPropItem) => {
      const result = {
        name: node.name ? prefix.concat(node.name).join('.') : undefined,
        required: node.setter.isRequired,
        label: getLabel(node),
        type: 'input-array',
        items: node.setter.props.itemSetter
          ? {
              ...toAmis(
                context,
                [
                  {
                    setter: { ...node.setter.props.itemSetter },
                    title: { label: false },
                    // 如果是复杂的对象要这么给一个固定的name
                    name: 'flat',
                  } as any,
                ],
                [],
                opts
              )[0],
              name: 'flat',
              onChange: (...args: any) => {
                debugger;
              },
              // type: 'input-text',
            }
          : {},
        scaffold: node.setter.props?.itemSetter?.initialValue,
        // onChange: (...args: any) => {
        //   console.log('args', args);
        //   debugger;
        // },
      };
      debugger;
      return result;
    },
    MixedSetter: (node: IPropItem) => {
      //
      const setters = node.setter.props.setters;
      return {
        name: node.name ? prefix.concat(node.name).join('.') : undefined,
        required: node.setter.isRequired,
        label: getLabel(node),
        formLabel: getLabel(node),
        type: 'ae-MixedSetter',
        value: node.setter.initialValue,
        setters,
      };
    },
    SchemaNodeSetter: node => {},

    // FunctionSetter: (node: IPropItem) => {},
    SlotSetter: (node: IPropItem) => {
      return map['MixedSetter']({
        ...node,
        setter: {
          componentName: 'MixedSetter',
          props: {
            setters: [
              {
                componentName: 'StringSetter',
                isRequired: false,
              },
              {
                componentName: 'NumberSetter',
                isRequired: false,
              },
              {
                componentName: 'SlotSetter',
                props: {
                  mode: 'node',
                },
              },
            ],
          },
        },
      });
    },
  };
  const result = props.map(item => {
    const componentName = item?.setter?.componentName;

    if (map[componentName]) {
      return map[componentName](item);
    }
    return {
      name: `${item.name}`,
      type: 'input-text',
      label: `未实现${item.setter.componentName} ${item.title.label}  ${item.name} `,
    };
  });
  console.log(result, 'xxx');
  return result.map(p => {
    return { ...p, name: `${p.name}` };
  });
}

export function toAmisEvent(
  events: {
    name: string;
    propType: {
      type: string;
      params: { name: string; propType: string }[];
      returns: { propType: number };
      raw: string;
    };
  }[]
): RendererPluginEvent[] {
  const result = (events ?? []).map(p => {
    const items: any = {};
    const hasParams =
      typeof p.propType === 'object' && p.propType.params?.length;
    if (hasParams)
      p.propType.params.map(p => {
        items[p.name] = { type: p.propType };
      });
    return {
      eventName: p.name,
      eventLabel: p.name,
      description: p.name,
      dataSchema: [
        {
          type: 'object',
          properties: {
            context: {
              type: hasParams
                ? p.propType.params[0]?.propType ?? 'object'
                : 'object',
              title: '事件的第一个参数',
              description: '第一个参数',
            },
            rest: {
              type: 'array',
              title: '事件的额外参数',
              description: '数组的索引是参数的类型',
            },
          },
        },
      ],
    };
  });
  return result;
}
