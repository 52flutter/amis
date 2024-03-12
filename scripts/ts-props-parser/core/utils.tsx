import './MixedSetter';
import { tipedLabel } from 'amis-editor-core';
import { Button, Icon, TooltipWrapper } from 'amis-ui';
import { IPropItem } from './types';
import React from 'react';

export function getLabel(item: IPropItem) {
  return item.title.tip
    ? tipedLabel(item.title.label, item.title.tip)
    : item.title.label;
}

export function schemaNodeEdit(node: IPropItem, manager?: any) {
  return {
    name: node.name,
    asFormItem: true,
    label: getLabel(node),
    children: ({ value, onBulkChange, name, data, onChange, ...rest }: any) => {
      value = value ?? {
        // schema中不存在容器，打开子编辑器时需要包裹一层
        type: 'wrapper',
        body: [],
        size: 'none',
        schemaNode: true,
      };
      return (
        <div className="mb-3 flex flex-row justify-center items-center">
          <div className="flex-1">
            <Button
              level="info"
              size="sm"
              // className="m-b-sm"
              block
              onClick={() => {
                (manager ?? (rest.manager as any)).openSubEditor({
                  title: '配置' + node.title.label,
                  value: value,
                  onChange: (_value: any) => {
                    // const newValue = set(
                    //   value,
                    //   prefix.concat(node.name),
                    //   _value
                    // );
                    // newValue = { ...value, [opts.name ?? '']: newValue };
                    onChange({ ..._value, schemaNode: true });
                  },
                  // onBulkChange({
                  //   [name]: {
                  //     ...value,
                  //   },
                  // }),
                });
              }}
            >
              {'配置面板'}
            </Button>
          </div>
          <a
            style={{ marginLeft: 8 }}
            onClick={() => {
              onChange(undefined);
            }}
            key="delete"
            data-tooltip={'清空'}
            data-position="left"
          >
            <TooltipWrapper tooltip="清空">
              <Icon icon="status-close" className="icon" />
            </TooltipWrapper>
          </a>
        </div>
      );
    },
  };
}
