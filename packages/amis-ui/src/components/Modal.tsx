/**
 * @file Modal
 * @description
 * @author fex
 */

import React from 'react';
import Transition, {
  ENTERED,
  ENTERING,
  EXITING,
  EXITED
} from 'react-transition-group/Transition';
import Portal from 'react-overlays/Portal';
import {current, addModal, removeModal} from './ModalManager';
import {ClassNamesFn, themeable, ThemeProps} from 'amis-core';
import {Icon} from './icons';
import {LocaleProps, localeable} from 'amis-core';
import {autobind, getScrollbarWidth} from 'amis-core';
import {DraggableCore} from 'react-draggable';
import type {
  DraggableBounds,
  DraggableEvent,
  DraggableData
} from 'react-draggable';

export const getContainerWithFullscreen =
  (container?: () => HTMLElement | HTMLElement | null) => () => {
    const envContainer =
      typeof container === 'function' ? container() : container;

    // 获取当前全屏元素
    const fullscreenElement = document.fullscreenElement;

    if (
      fullscreenElement &&
      (!envContainer || !fullscreenElement.contains(envContainer))
    ) {
      return fullscreenElement as HTMLElement;
    }
    return envContainer || null;
  };

export interface ModalProps extends ThemeProps, LocaleProps {
  className?: string;
  contentClassName?: string;
  size?: any;
  width?: any;
  height?: any;
  overlay?: boolean;
  onHide: (e: any) => void;
  closeOnEsc?: boolean;
  closeOnOutside?: boolean;
  container?: any;
  show?: boolean;
  disabled?: boolean;
  onExited?: () => void;
  onEntered?: () => void;
  children?: React.ReactNode | Array<React.ReactNode>;
  modalClassName?: string;
  modalMaskClassName?: string;
  draggable?: boolean;
}
export interface ModalState {
  bounds?: DraggableBounds;
  dragging?: {top: number; left: number};
}
const fadeStyles: {
  [propName: string]: string;
} = {
  [ENTERING]: 'in',
  [ENTERED]: 'in',
  [EXITING]: 'out'
};
const contentFadeStyles: {
  [propName: string]: string;
} = {
  [ENTERING]: 'in',
  [ENTERED]: '',
  [EXITING]: 'out'
};
export class Modal extends React.Component<ModalProps, ModalState> {
  static defaultProps = {
    container: document.body,
    size: '',
    overlay: true
  };

  isRootClosed = false;
  modalDom: HTMLElement;

  static Header = themeable(
    localeable(
      ({
        classnames: cx,
        className,
        showCloseButton,
        onClose,
        children,
        classPrefix,
        translate: __,
        forwardedRef,
        ...rest
      }: ThemeProps &
        LocaleProps & {
          className?: string;
          showCloseButton?: boolean;
          onClose?: () => void;
          children?: React.ReactNode;
          forwardedRef?: any;
        } & React.HTMLAttributes<HTMLDivElement>) => (
        <div {...rest} className={cx('Modal-header', className)}>
          {showCloseButton !== false ? (
            <a
              data-tooltip={__('Dialog.close')}
              data-position="left"
              onClick={onClose}
              className={cx('Modal-close')}
            >
              <Icon icon="close" className="icon" />
            </a>
          ) : null}
          {children}
        </div>
      )
    )
  );

  static Title = themeable(
    ({
      classnames: cx,
      className,
      children,
      classPrefix,
      forwardedRef,
      ...rest
    }: ThemeProps & {
      className?: string;
      children?: React.ReactNode;
      forwardedRef?: any;
    } & React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest} className={cx('Modal-title', className)}>
        {children}
      </div>
    )
  );

  static Body = themeable(
    ({
      classnames: cx,
      className,
      children,
      classPrefix,
      forwardedRef,
      ...rest
    }: ThemeProps & {
      className?: string;
      children?: React.ReactNode;
      forwardedRef?: any;
    } & React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest} className={cx('Modal-body', className)}>
        {children}
      </div>
    )
  );

  static Footer = themeable(
    ({
      classnames: cx,
      className,
      children,
      classPrefix,
      forwardedRef,
      ...rest
    }: ThemeProps & {
      className?: string;
      children?: React.ReactNode;
      forwardedRef?: any;
    } & React.HTMLAttributes<HTMLDivElement>) => (
      <div {...rest} className={cx('Modal-footer', className)}>
        {children}
      </div>
    )
  );

  draggleRef: any;

  constructor(props: any) {
    super(props);
    this.state = {
      bounds: {left: 0, top: 0, bottom: 0, right: 0},
      dragging: undefined
    };
    this.draggleRef = React.createRef();
  }

  componentDidMount() {
    if (this.props.show) {
      this.handleEnter();
      this.handleEntered();
    }
  }

  componentWillUnmount() {
    if (this.props.show) {
      this.handleExited();
    }
  }

  handleDragStart = (_event: DraggableEvent, uiData: DraggableData) => {
    const {clientWidth, clientHeight} = window.document.documentElement;
    const targetRect = this.draggleRef.current?.getBoundingClientRect?.();
    if (!targetRect) {
      return;
    }
    const nodeStyle = getComputedStyle(uiData.node);
    const marginTop = int(nodeStyle.marginTop);
    this.setState({
      bounds: {
        left: 0,
        right: clientWidth - targetRect.width,
        top: -marginTop,
        bottom: clientHeight - targetRect.height - marginTop
      }
    });

    const newPosition: {top: number; left: number} = {top: 0, left: 0};
    const node = uiData.node;
    const transformScale = 1;
    const {offsetParent} = uiData.node;
    if (!offsetParent) return;
    const parentRect = offsetParent.getBoundingClientRect();
    const clientRect = node.getBoundingClientRect();
    const cLeft = clientRect.left / transformScale;
    const pLeft = parentRect.left / transformScale;
    const cTop = clientRect.top / transformScale;
    const pTop = parentRect.top / transformScale;
    newPosition.left = cLeft - pLeft + offsetParent.scrollLeft;
    newPosition.top = cTop - pTop + offsetParent.scrollTop - marginTop;
    this.setState({dragging: newPosition});
    _event.stopPropagation();
  };

  onDrag = (e: any, {node, deltaX, deltaY}: any) => {
    e.stopPropagation();
    if (!this.state.dragging) {
      throw new Error('onDrag called before onDragStart.');
    }
    let top = this.state.dragging.top + deltaY;
    let left = this.state.dragging.left + deltaX;
    const bounds = this.state.bounds;
    const [x, y] = getBoundPosition(node, bounds, left, top);
    const newPosition = {top: y, left: x};
    this.setState({dragging: newPosition});
  };

  /**
   * onDragStop event handler
   * @param  {Event}  e             event data
   * @param  {Object} callbackData  an object with node, delta and position information
   */
  onDragStop = (e: any, {node}: any) => {
    if (!this.state.dragging) {
      throw new Error('onDragEnd called before onDragStart.');
    }

    const {left, top} = this.state.dragging;
    const newPosition: {top: number; left: number} = {top, left};
    this.setState({dragging: newPosition});
  };

  handleEnter = () => {
    document.body.classList.add(`is-modalOpened`);
    if (
      window.innerWidth - document.documentElement.clientWidth > 0 ||
      document.body.scrollHeight > document.body.clientHeight
    ) {
      const scrollbarWidth = getScrollbarWidth();
      document.body.style.width = `calc(100% - ${scrollbarWidth}px)`;
    }
  };

  handleEntered = () => {
    const onEntered = this.props.onEntered;

    document.body.addEventListener(
      'mousedown',
      this.handleRootMouseDownCapture,
      true
    );
    document.body.addEventListener(
      'mouseup',
      this.handleRootMouseUpCapture,
      true
    );
    document.body.addEventListener('mouseup', this.handleRootMouseUp);

    onEntered && onEntered();
  };
  handleExited = () => {
    const onExited = this.props.onExited;

    document.body.removeEventListener('mouseup', this.handleRootMouseUp);
    document.body.removeEventListener(
      'mousedown',
      this.handleRootMouseDownCapture,
      true
    );
    document.body.removeEventListener(
      'mouseup',
      this.handleRootMouseUpCapture,
      true
    );

    onExited && onExited();
    setTimeout(() => {
      if (!document.querySelector('.amis-dialog-widget')) {
        document.body.classList.remove(`is-modalOpened`);
        document.body.style.width = '';
      }
    }, 200);
  };

  modalRef = (ref: any) => {
    this.modalDom = ref;
    const {classPrefix: ns} = this.props;
    if (ref) {
      addModal(this);
      (ref as HTMLElement).classList.add(`${ns}Modal--${current()}th`);
    } else {
      removeModal(this);
    }
  };

  @autobind
  handleRootMouseDownCapture(e: MouseEvent) {
    const target = e.target as HTMLElement;
    const {closeOnOutside, classPrefix: ns} = this.props;
    const isLeftButton =
      (e.button === 1 && window.event !== null) || e.button === 0;

    this.isRootClosed = !!(
      isLeftButton &&
      closeOnOutside &&
      target &&
      this.modalDom &&
      ((!this.modalDom.contains(target) && !target.closest('[role=dialog]')) ||
        (target.matches(`.${ns}Modal`) && target === this.modalDom))
    ); // 干脆过滤掉来自弹框里面的点击
  }

  @autobind
  handleRootMouseUpCapture(e: MouseEvent) {
    // mousedown 的时候不在弹窗里面，则不需要判断了
    if (!this.isRootClosed) {
      return;
    }

    // 再判断 mouseup 的时候是不是在弹窗里面
    this.handleRootMouseDownCapture(e);
  }

  @autobind
  handleRootMouseUp(e: MouseEvent) {
    const {onHide} = this.props;
    this.isRootClosed && !e.defaultPrevented && onHide(e);
  }

  createStyle = (pos?: {left: number; top: number}) => {
    if (!pos) {
      return {};
    }
    const useCSSTransforms = false;
    let style: any;
    // 这里不能使用transform modal使用fixed定位 transform会影响fixed的相对位置
    if (useCSSTransforms) {
      style = setTransform(pos);
    } else {
      // top,left (slow)
      style = setTopLeft(pos);
    }

    return style;
  };

  render() {
    const {
      className,
      contentClassName,
      children,
      container,
      show,
      size,
      style,
      overlay,
      width,
      height,
      modalClassName,
      modalMaskClassName,
      classnames: cx,
      classPrefix,
      draggable = false
    } = this.props;

    let _style = {
      width: style?.width ? style?.width : width,
      height: style?.height ? style?.height : height
    };

    return (
      <Transition
        mountOnEnter
        unmountOnExit
        appear
        in={show}
        timeout={500}
        onEnter={this.handleEnter}
        onExited={this.handleExited}
        onEntered={this.handleEntered}
      >
        {(status: string) => (
          <Portal container={getContainerWithFullscreen(container)}>
            <div
              ref={this.modalRef}
              role="dialog"
              className={cx(
                `amis-dialog-widget Modal`,
                {
                  [`Modal--${size}`]: size
                },
                className
              )}
            >
              {overlay ? (
                <div
                  className={cx(
                    `Modal-overlay`,
                    fadeStyles[status],
                    modalMaskClassName
                  )}
                />
              ) : null}

              <DraggableCore
                disabled={!draggable}
                onStart={(event, uiData) => this.handleDragStart(event, uiData)}
                onDrag={this.onDrag}
                onStop={this.onDragStop}
                handle={`.${classPrefix}Modal-header`}
                nodeRef={this.draggleRef}
              >
                <div
                  ref={this.draggleRef}
                  className={cx(
                    `Modal-content`,
                    size === 'custom' ? 'Modal-content-custom' : '',
                    contentClassName,
                    modalClassName,
                    contentFadeStyles[status]
                  )}
                  style={{..._style, ...this.createStyle(this.state.dragging)}}
                >
                  {status === EXITED ? null : children}
                </div>
              </DraggableCore>
            </div>
          </Portal>
        )}
      </Transition>
    );
  }
}

const FinalModal = themeable(localeable(Modal));

export default FinalModal as typeof FinalModal & {
  Header: typeof Modal.Header;
  Title: typeof Modal.Title;
  Body: typeof Modal.Body;
  Footer: typeof Modal.Footer;
};
export function setTransform({top, left, width, height}: any) {
  // Replace unitless items with px
  const translate = `translate(${left}px,${top}px)`;
  return {
    transform: translate,
    WebkitTransform: translate,
    MozTransform: translate,
    msTransform: translate,
    OTransform: translate,
    // width: `${width}px`,
    // height: `${height}px`,
    position: 'absolute'
  };
}

export function setTopLeft({top, left, width, height}: any): Object {
  return {
    top: `${top}px`,
    left: `${left}px`,
    // width: `${width}px`,
    // height: `${height}px`,
    position: 'absolute'
  };
}
export function perc(num: number): string {
  return num * 100 + '%';
}

export function getBoundPosition(
  node: HTMLElement,
  bounds: any,
  x: number,
  y: number
): [number, number] {
  bounds = typeof bounds === 'string' ? bounds : {...bounds};

  if (typeof bounds === 'string') {
    const {ownerDocument} = node;
    const ownerWindow: any = ownerDocument.defaultView;
    let boundNode;
    if (bounds === 'parent') {
      boundNode = node.parentNode;
    } else {
      boundNode = ownerDocument.querySelector(bounds);
    }
    if (!(boundNode instanceof ownerWindow.HTMLElement)) {
      throw new Error(
        'Bounds selector "' + bounds + '" could not find an element.'
      );
    }
    const boundNodeEl: any = boundNode; // for Flow, can't seem to refine correctly
    const nodeStyle = ownerWindow.getComputedStyle(node);
    const boundNodeStyle = ownerWindow.getComputedStyle(boundNodeEl);
    // Compute bounds. This is a pain with padding and offsets but this gets it exactly right.
    bounds = {
      left:
        -node.offsetLeft +
        int(boundNodeStyle.paddingLeft) +
        int(nodeStyle.marginLeft),
      top:
        -node.offsetTop +
        int(boundNodeStyle.paddingTop) +
        int(nodeStyle.marginTop),
      right:
        innerWidth(boundNodeEl) -
        outerWidth(node) -
        node.offsetLeft +
        int(boundNodeStyle.paddingRight) -
        int(nodeStyle.marginRight),
      bottom:
        innerHeight(boundNodeEl) -
        outerHeight(node) -
        node.offsetTop +
        int(boundNodeStyle.paddingBottom) -
        int(nodeStyle.marginBottom)
    };
  }

  // Keep x and y below right and bottom limits...
  if (isNum(bounds.right)) x = Math.min(x, bounds.right);
  if (isNum(bounds.bottom)) y = Math.min(y, bounds.bottom);

  // But above left and top limits.
  if (isNum(bounds.left)) x = Math.max(x, bounds.left);
  if (isNum(bounds.top)) y = Math.max(y, bounds.top);

  return [x, y];
}

export function isNum(num: any): boolean {
  return typeof num === 'number' && !isNaN(num);
}

export function int(a: string): number {
  return parseInt(a, 10);
}

export function outerHeight(node: any): number {
  // This is deliberately excluding margin for our calculations, since we are using
  // offsetTop which is including margin. See getBoundPosition
  let height = node.clientHeight;
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  height += int(computedStyle.borderTopWidth);
  height += int(computedStyle.borderBottomWidth);
  return height;
}

export function outerWidth(node: any): number {
  let width = node.clientWidth;
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  width += int(computedStyle.borderLeftWidth);
  width += int(computedStyle.borderRightWidth);
  return width;
}
export function innerHeight(node: any): number {
  let height = node.clientHeight;
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  height -= int(computedStyle.paddingTop);
  height -= int(computedStyle.paddingBottom);
  return height;
}

export function innerWidth(node: any): number {
  let width = node.clientWidth;
  const computedStyle = node.ownerDocument.defaultView.getComputedStyle(node);
  width -= int(computedStyle.paddingLeft);
  width -= int(computedStyle.paddingRight);
  return width;
}
