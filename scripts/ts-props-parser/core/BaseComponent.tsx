import { CustomStyle, createObject, setThemeClassName } from 'amis-core';
import { omit } from 'lodash';
import React from 'react';
import { parseProps } from './rendererParser';

export default class BaseComponent<T> extends React.Component<T> {
  getHandleEvent =
    (type: string) =>
    (...e: any) => {
      const { dispatchEvent, data } = this.props as any;
      const [first, ...rest] = e;
      dispatchEvent(
        type,
        createObject(data, {
          event: {
            context: first,
            rest: rest,
          },
        })
      );
    };

  handleCustomEventChange = (type: string, e: any) => {
    const { dispatchEvent, data } = this.props as any;
    dispatchEvent(
      'customEvent',
      createObject(data, {
        event: { type, context: e },
      })
    );
  };

  getProps = () => {
    const {
      id,
      wrapperCustomStyle,
      className,
      classnames: cx,
    } = this.props as any;
    let itemProps: any = parseProps(this.props, this);
    return {
      ...omit(itemProps, '$$id'),
      className: cx(
        className,
        itemProps.className,
        setThemeClassName({
          ...this.props,
          name: 'wrapperCustomStyle',
          id,
          themeCss: wrapperCustomStyle,
        })
      ),
    };
  };

  renderBody = (props: T) => {
    return <></>;
  };

  render(): React.ReactNode {
    const itemProps = this.getProps();
    const { id, wrapperCustomStyle, themeCss, env } = this.props as any;
    return (
      <>
        {this.renderBody(itemProps as T)}
        <CustomStyle
          {...this.props}
          config={{
            wrapperCustomStyle,
            id,
            themeCss,
            classNames: [
              {
                key: 'baseControlClassName',
              },
            ],
          }}
          env={env}
        />
      </>
    );
  }
}
