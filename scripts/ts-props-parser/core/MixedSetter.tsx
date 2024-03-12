import React from 'react';
import cx from 'classnames';
import { Button, FormControlProps, FormItem } from 'amis';
import { isExpression } from 'amis-core';
import { getSchemaTpl } from 'amis-editor-core';
import { toAmis } from './editorParser';
import { isPlainObject } from 'lodash';
import { schemaNodeEdit } from './utils';

interface optionType {
  label: string;
  value: string;
}

export interface MixedSetterProps extends FormControlProps {
  setters?: {
    componentName: string;
    props: any;
    isRequired?: boolean;
    initialValue?: any;
  }[];
  disabledValueFormula?: boolean;
  defaultActiveOption?: string;
}

export interface TableColumnWidthState {
  columns?: Array<any>;
  activeOption: optionType;
}
enum OptionValueEnum {
  valueFormula = 'valueFormula',
  string = 'string',
  number = 'number',
  array = 'array',
  object = 'object',
  bool = 'boolean',
  slot = 'slot',
}
export default class MixedSetter extends React.Component<
  MixedSetterProps,
  TableColumnWidthState
> {
  options: Array<optionType & { componentName?: string }> = [
    {
      label: '变量输入',
      value: 'valueFormula',
      componentName: '*',
    },
    {
      label: '文本',
      value: 'string',
      // componentName: ['StringSetter'],
    },
    {
      label: '数字',
      value: 'number',
      componentName: 'NumberSetter',
    },
    {
      label: '布尔',
      value: 'boolean',
      componentName: 'BoolSetter',
    },
    {
      label: '数组',
      value: 'array',
      componentName: 'BoolSetter',
    },
    {
      label: '对象',
      value: 'object',
    },
    {
      label: '节点',
      value: 'slot',
    },
  ];

  constructor(props: any) {
    super(props);
    // this.options = (props.types ?? []).map((p: any) => {
    //   return { label: p.componentName, value: p.p.componentName };
    // });

    this.state = {
      activeOption: this.options[0],
    };
  }

  componentDidMount(): void {
    const { value } = this.props;
    if (this.props.defaultActiveOption) {
      this.setState({
        activeOption: this.props.defaultActiveOption as any,
      });
    }
    if (value === undefined) return;
    if (isExpression(value)) {
      this.state.activeOption !== this.options[0] &&
        this.setState({
          activeOption: this.options[0],
        });
    } else if (typeof value === 'number') {
      this.state.activeOption !== this.options[2] &&
        this.setState({
          activeOption: this.options[2],
        });
    } else if (typeof value === 'string') {
      this.state.activeOption !== this.options[1] &&
        this.setState({
          activeOption: this.options[1],
        });
    } else if (typeof value === 'boolean') {
      this.state.activeOption !== this.options[3] &&
        this.setState({
          activeOption: this.options[3],
        });
    } else if (Array.isArray(value)) {
      this.state.activeOption !== this.options[4] &&
        this.setState({
          activeOption: this.options[4],
        });
    } else if (typeof value === 'object' && value?.schemaNode === true) {
      this.state.activeOption !== this.options[6] &&
        this.setState({
          activeOption: this.options[6],
        });
    } else if (typeof value === 'object') {
      this.state.activeOption !== this.options[5] &&
        this.setState({
          activeOption: this.options[5],
        });
    }
  }

  handleOptionChange(item: optionType) {
    if (item === this.state.activeOption) return;

    this.setState({
      activeOption: item,
    });
    this.props?.onChange?.(undefined);
  }

  renderHeader() {
    const {
      render,
      formLabel,
      labelRemark,
      useMobileUI,
      env,
      popOverContainer,
      data,
      setters = [],
    } = this.props;

    const classPrefix = env?.theme?.classPrefix;

    const { activeOption } = this.state;
    let _option = this.options.concat([]);
    if (!setters?.find(p => p.componentName === 'StringSetter')) {
      _option = _option.filter(p => p.value !== 'string');
    }
    if (!setters?.find(p => p.componentName === 'NumberSetter')) {
      _option = _option.filter(p => p.value !== 'number');
    }
    if (!setters?.find(p => p.componentName === 'ArraySetter')) {
      _option = _option.filter(p => p.value !== 'array');
    }
    if (!setters?.find(p => p.componentName === 'BoolSetter')) {
      _option = _option.filter(p => p.value !== 'boolean');
    }
    if (!setters?.find(p => p.componentName === 'ObjectSetter')) {
      _option = _option.filter(p => p.value !== 'object');
    }
    if (!setters?.find(p => p.componentName === 'SlotSetter')) {
      _option = _option.filter(p => p.value !== 'slot');
    }
    if (this.props.disabledValueFormula === true) {
      _option = _option.filter(p => p.value !== 'valueFormula');
    }
    const itemEnum =
      setters?.find(p => p.componentName === 'RadioGroupSetter') ||
      setters?.find(p => p.componentName === 'SelectSetter');
    if (itemEnum) {
      if (itemEnum?.props?.options?.length) {
        const firstVal = itemEnum?.props?.options[0].value;
        const isString = typeof firstVal === 'string';
        if (isString && !_option.find(p => p.label === 'string')) {
          _option = _option.concat(this.options[1]);
        } else if (!isString && !_option.find(p => p.label === 'number')) {
          _option = _option.concat(this.options[2]);
        }
      }
    }
    return (
      <div className="ae-columnWidthControl-header">
        <label className={cx(`${classPrefix}Form-label`)}>
          {formLabel
            ? isPlainObject(formLabel)
              ? render('label-form', formLabel)
              : formLabel
            : ''}
          {labelRemark
            ? render('label-remark', {
                type: 'remark',
                icon: labelRemark.icon || 'warning-mark',
                tooltip: labelRemark,
                className: cx(`Form-lableRemark`, labelRemark?.className),
                useMobileUI,
                container: popOverContainer
                  ? popOverContainer
                  : env && env.getModalContainer
                  ? env.getModalContainer
                  : undefined,
              })
            : null}
        </label>
        {render(
          'mixedSetterControl-options',
          {
            type: 'dropdown-button',
            level: 'link',
            size: 'sm',
            label: activeOption.label,
            align: 'right',
            closeOnClick: true,
            closeOnOutside: true,
            buttons: _option.map(item => ({
              ...item,
              onClick: () => this.handleOptionChange(item),
            })),
          },
          {
            popOverContainer: null,
          }
        )}
      </div>
    );
  }

  handleChange(type: string, val: number) {
    const onChange = this.props.onChange;
    onChange?.(val);
  }

  renderBody() {
    const { onBulkChange, render, onChange, value, setters = [] } = this.props;
    const { activeOption } = this.state;
    if (!activeOption?.value) {
      return <></>;
    }

    if (activeOption.value === OptionValueEnum.valueFormula) {
      return render(
        'typeof-valueFormula',
        getSchemaTpl('valueFormula', {
          mode: 'vertical',
          name: 'inner',
          label: false,
          rendererSchema: { type: 'input-text', readOnly: true },
          valueType: 'string',
          value,
        }),
        {
          onChange: (val: number) =>
            this.handleChange(OptionValueEnum.valueFormula, val),
        }
      );
    }
    if (activeOption.value === OptionValueEnum.slot) {
      return render(
        'typeof-slot',
        {
          name: 'inner',
          asFormItem: true,
          label: false,
          children: ({ value, onBulkChange, name, data, onChange }: any) => {
            value = value ?? {
              // schema中不存在容器，打开子编辑器时需要包裹一层
              type: 'wrapper',
              body: [],
              size: 'none',
              schemaNode: true,
            };
            return (
              <div className="mb-3">
                <Button
                  level="info"
                  size="sm"
                  className="m-b-sm"
                  block
                  onClick={() => {
                    if (this.props.manager) {
                      this.props.manager.openSubEditor({
                        title: '配置',
                        value: value,
                        onChange: (_value: any) => {
                          this.handleChange(OptionValueEnum.slot, {
                            ..._value,
                            schemaNode: true,
                          });
                        },
                      });
                    }
                  }}
                >
                  {'配置面板'}
                </Button>
              </div>
            );
          },
        } as any,
        {
          onChange: (val: number) =>
            this.handleChange(OptionValueEnum.valueFormula, val),
        }
      );
    }
    if (activeOption.value === OptionValueEnum.string) {
      const itemEnum =
        setters?.find(p => p.componentName === 'RadioGroupSetter') ||
        setters?.find(p => p.componentName === 'SelectSetter');
      if (itemEnum) {
        return render(
          'typeof-string',
          {
            label: false,
            name: 'inner',
            value,
            type: 'select',
            options: itemEnum.props.options,
          } as any,
          {
            onChange: (val: number) =>
              this.handleChange(OptionValueEnum.string, val),
          }
        );
      }
      return render(
        'typeof-string',
        {
          label: false,
          name: 'inner',
          value,
          type: 'input-text',
        } as any,
        {
          onChange: (val: number) =>
            this.handleChange(OptionValueEnum.string, val),
        }
      );
    }
    if (activeOption.value === OptionValueEnum.number) {
      return render(
        'typeof-number',
        {
          label: false,
          name: 'inner',
          type: 'input-number',
          value,
        } as any,
        {
          onChange: (val: number) =>
            this.handleChange(OptionValueEnum.string, val),
        }
      );
    }
    if (activeOption.value === OptionValueEnum.bool) {
      return render(
        'typeof-bool',
        {
          label: false,
          name: 'inner',
          type: 'switch',
          value,
        } as any,
        {
          onChange: (val: number) =>
            this.handleChange(OptionValueEnum.string, val),
        }
      );
    }
    if (activeOption.value === OptionValueEnum.object) {
      const itemConfig = setters?.find(p => p.componentName === 'ObjectSetter');
      if (itemConfig?.props?.config?.items?.length) {
        return render(
          'typeof-object',
          {
            type: 'form',
            mode: 'normal',
            wrapWithPanel: false,
            body: [
              ...toAmis(
                { eventCtx: {}, plugin: {} } as any,
                itemConfig?.props?.config?.items,
                [],
                { valueFormula: false }
              ),
            ],
            // label: false,
            // name: 'inner',
            // type: 'input-kv',
            // draggable: false,
          } as any,
          {
            data: value,
            onChange: (val: number) =>
              this.handleChange(OptionValueEnum.string, val),
          }
        );
      } else {
        return render(
          'typeof-object',
          {
            label: false,
            name: 'inner',
            type: 'input-kv',
            draggable: false,
            value,
          } as any,
          {
            onChange: (val: number) =>
              this.handleChange(OptionValueEnum.string, val),
          }
        );
      }
    }
    if (activeOption.value === OptionValueEnum.array) {
      const ArraySetter = this.props.setters?.find(
        p => p.componentName === 'ArraySetter'
      );
      const item = toAmis(
        { eventCtx: {}, plugin: {} } as any,
        [
          {
            setter: ArraySetter as any,
            title: { label: '' },
          },
        ],
        [],
        { valueFormula: false }
      );
      if (ArraySetter) {
        return render(
          'typeof-array',
          {
            ...item[0],
            label: false,
            value,
          },
          {
            onChange: (val: number) =>
              this.handleChange(OptionValueEnum.string, val),
          }
        );
      }
    }
    return <></>;
  }

  render() {
    return (
      <div className={cx('ae-MixedSetterControl')}>
        {this.renderHeader()}
        {this.renderBody()}
      </div>
    );
  }
}

@FormItem({
  type: 'ae-MixedSetter',
  renderLabel: false,
})
export class MixedSetterRender extends MixedSetter {}
