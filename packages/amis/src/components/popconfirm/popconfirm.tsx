import * as React from 'react';
// import Icon from '../icon';
import {Button, Icon} from 'amis-ui';

import usePopper, {PopperProps} from '../../hooks/usePopper';

export type RenderFunction = () => React.ReactNode;

export interface PopconfirmProps extends PopperProps {
  okText?: string;
  okType?: string;
  cancelText?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  okButtonProps?: any;
  cancelButtonProps?: any;
  title?: React.ReactNode | RenderFunction;
  message?: React.ReactNode | RenderFunction;
  onCancel?: (e?: React.MouseEvent<HTMLElement>) => void;
  onConfirm?: (e?: React.MouseEvent<HTMLElement>) => void;
}

const Popconfirm: React.FC<PopconfirmProps> = props => {
  const allProps = props;

  const {
    icon = true,
    title,
    okText,
    okType,
    message,
    children,
    onCancel,
    onConfirm,
    cancelText,
    okButtonProps,
    defaultVisible,
    onVisibleChange,
    cancelButtonProps,
    prefixCls: customPrefixcls
  } = allProps;

  // className前缀
  const prefixCls = 'cxd-popconfirm';

  const [visible, setVisible] = React.useState(
    !!props.visible || defaultVisible
  );
  React.useEffect(() => {
    setVisible(!!props.visible);
  }, [props.visible]);

  const confirmLocator =
    React.Children.count(children) === 1 && (children as any).type ? (
      children
    ) : (
      <span>{children}</span>
    );

  const confirmTitle = typeof title === 'function' ? title() : title;

  const confirmMsg = typeof message === 'function' ? message() : message;

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.visible === undefined && setVisible(false);
    onVisibleChange && onVisibleChange(false);
    onCancel && onCancel(e);
  };
  const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.visible === undefined && setVisible(false);
    onVisibleChange && onVisibleChange(false);
    onConfirm && onConfirm(e);
  };

  const confirmPopper = (
    <div className={`${prefixCls}-content`}>
      {confirmTitle && (
        <h3 className={`${prefixCls}-title`}>
          {icon === true ? (
            <Icon
              className={`${prefixCls}-title-icon`}
              icon={`alert-warning`}
            />
          ) : (
            icon
          )}
          {confirmTitle}
        </h3>
      )}
      <div className={`${prefixCls}-message`}>{confirmMsg}</div>
      <div className={`${prefixCls}-interaction`}>
        <Button size="sm" {...cancelButtonProps} onClick={handleCancel}>
          {cancelText || '取消'}
        </Button>
        <Button
          size="sm"
          {...okButtonProps}
          level={okType ?? 'primary'}
          onClick={handleConfirm}
        >
          {okText || '确认'}
        </Button>
      </div>
    </div>
  );

  const handleVisibleChange = (visible: boolean) => {
    props.visible === undefined && setVisible(visible);
    onVisibleChange && onVisibleChange(visible);
  };

  const popperProps = {
    ...allProps,
    visible,
    prefixCls,
    arrow: true,
    onVisibleChange: handleVisibleChange
  };

  return usePopper(confirmLocator as any, confirmPopper, popperProps);
};

Popconfirm.displayName = 'Popconfirm';
export default Popconfirm;
