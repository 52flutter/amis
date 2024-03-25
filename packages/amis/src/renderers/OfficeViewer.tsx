// // /**
// //  * office 文件预览
// //  */

// import React from 'react';
// import {BaseSchema} from '../Schema';
// import {
//   ActionObject,
//   createObject,
//   filter,
//   isApiOutdated,
//   IScopedContext,
//   Renderer,
//   RendererProps,
//   resolveVariable,
//   resolveVariableAndFilter,
//   ScopedContext
// } from 'amis-core';
// import type {Word, Excel} from 'office-viewer';
// import {Spinner} from 'amis-ui';
// import {Payload} from '../types';

// // export interface OfficeViewerSchema extends BaseSchema {
// //   type: 'office-viewer';
// //   /**
// //    * 文件地址
// //    */
// //   src: string;

// //   /**
// //    * word 文档的渲染配置
// //    */
// //   wordOptions?: any;

// //   /**
// //    * 是否显示文档
// //    */
// //   display?: boolean;
// // }

// // export interface OfficeViewerProps
// //   extends RendererProps,
// //     Omit<OfficeViewerSchema, 'className'> {
// //   columnsCount: number;
// // }

// // export interface OfficeViewerState {
// //   // 是否加载中
// //   loading: boolean | null;
// // }

// // export default class OfficeViewer extends React.Component<
// //   OfficeViewerProps,
// //   OfficeViewerState
// // > {
// //   rootElement: React.RefObject<HTMLDivElement>;

//   office: Word | Excel;

// //   fileName?: string;

// //   // 文档数据，避免 update 参数的时候重复加载
// //   document?: any;

//   finalSrc?: string;

//   constructor(props: OfficeViewerProps) {
//     super(props);
//     this.rootElement = React.createRef();
//     this.state = {
//       loading: false
//     };
//   }

// //   componentDidMount() {
// //     if (this.rootElement?.current) {
// //       this.renderWord();
// //     }
// //   }

// //   componentDidUpdate(prevProps: OfficeViewerProps) {
// //     // 避免 loading 时更新
// //     if (this.state.loading) {
// //       return;
// //     }
// //     const props = this.props;

// //     if (isApiOutdated(prevProps.src, props.src, prevProps.data, props.data)) {
// //       this.fetchWord().then(() => {
// //         this.renderWord();
// //       });
// //     }

// //     if (props.name) {
// //       if (prevProps.data[props.name] !== props.data[props.name]) {
// //         this.renderWord();
// //       }
// //     }

// //     if (
// //       JSON.stringify(prevProps.wordOptions) !==
// //         JSON.stringify(props.wordOptions) ||
// //       prevProps.display !== props.display
// //     ) {
// //       this.renderWord();
// //     }

//     if (props.wordOptions?.enableVar) {
//       if (
//         props.trackExpression &&
//         filter(props.trackExpression, props.data) !==
//           filter(prevProps.trackExpression, prevProps.data)
//       ) {
//         this.renderWord();
//       } else {
//         // 默认只更新变量提升性能
//         this.office?.updateVariable();
//       }
//     }
//   }

// //   /**
// //    * 接收动作事件
// //    */
// //   doAction(action: ActionObject, args: any, throwErrors: boolean): any {
// //     const actionType = action?.actionType as string;

//     if (actionType === 'saveAs') {
//       this.office?.download(args?.name || this.fileName);
//     }

//     if (actionType === 'print') {
//       this.office?.print();
//     }
//   }

// //   /**
// //    * 执行变量替换
// //    */
// //   evalVar(text: string, data: any) {
// //     const localData = this.props.data;
// //     return resolveVariable(text, createObject(localData, data));
// //   }

// //   async renderWord() {
// //     const {src, name} = this.props;
// //     if (src) {
// //       if (!this.document) {
// //         await this.fetchWord();
// //       }
// //       await this.renderRemoteWord();
// //     } else if (name) {
// //       this.renderFormFile();
// //     }
// //   }

// //   async fetchWord() {
// //     const {env, src, data, translate: __} = this.props;
// //     const finalSrc = src
// //       ? resolveVariableAndFilter(src, data, '| raw')
// //       : undefined;

// //     if (typeof finalSrc === 'string') {
// //       this.fileName = finalSrc.split('/').pop();
// //     }

// //     if (!finalSrc) {
// //       console.warn('file src is empty');
// //       return;
// //     }
// //     let response: Payload;

//     if (!finalSrc) {
//       console.warn('file src is empty');
//       return;
//     }

//     this.finalSrc = finalSrc;

//     let response: Payload;

// //     try {
// //       response = await env.fetcher(finalSrc, data, {
// //         responseType: 'arraybuffer'
// //       });
// //       this.document = response.data;
// //     } catch (error) {
// //       // 显示一下报错信息避免没法选中组件
// //       if (this.rootElement?.current) {
// //         this.rootElement.current.innerHTML =
// //           __('loadingFailed') + ' url:' + finalSrc;
// //       }
// //     } finally {
// //       this.setState({
// //         loading: false
// //       });
// //     }
// //   }

// //   /**
// //    * 渲染远端文件
// //    */
// //   async renderRemoteWord() {
// //     const {wordOptions, env, src, data, display, translate: __} = this.props;

//   async initOffice(officeViewer: any, file?: ArrayBuffer) {
//     const {
//       wordOptions,
//       excelOptions,
//       env,
//       src,
//       data,
//       translate: __
//     } = this.props;
//     const createOfficeViewer = officeViewer.createOfficeViewer;
//     const office = await createOfficeViewer(
//       file || this.document,
//       {},
//       this.finalSrc
//     );

//     if (office instanceof officeViewer.Word) {
//       office.updateOptions({
//         ...wordOptions,
//         data,
//         evalVar: this.evalVar.bind(this)
//       });
//     } else if (office instanceof officeViewer.Excel) {
//       office.updateOptions({
//         ...excelOptions,
//         data,
//         evalVar: this.evalVar.bind(this)
//       });
//       await office.loadExcel();
//     }

//     return office;
//   }

//   /**
//    * 渲染远端文件
//    */
//   async renderRemoteWord() {
//     const {
//       wordOptions,
//       excelOptions,
//       env,
//       src,
//       data,
//       display,
//       translate: __
//     } = this.props;

// //     import('office-viewer').then(async (officeViewer: any) => {
// //       const Word = officeViewer.Word;
// //       const word = new Word(this.document, {
// //         ...wordOptions,
// //         data,
// //         evalVar: this.evalVar.bind(this)
// //       });

//     import('office-viewer').then(async (officeViewer: any) => {
//       const office = await this.initOffice(officeViewer);

//       if (display !== false) {
//         office.render(this.rootElement?.current!);
//       } else if (display === false && this.rootElement?.current) {
//         // 设置为 false 后清空
//         this.rootElement.current.innerHTML = '';
//       }

//       this.office = office;
//     });
//   }

// //         import('office-viewer').then(async (officeViewer: any) => {
// //           const Word = officeViewer.Word;
// //           const word = new Word(data, {
// //             ...wordOptions,
// //             evalVar: this.evalVar.bind(this)
// //           });
// //           if (display !== false) {
// //             word.render(this.rootElement?.current!);
// //           } else if (display === false && this.rootElement?.current) {
// //             // 设置为 false 后清空
// //             this.rootElement.current.innerHTML = '';
// //           }
// //           this.word = word;
// //         });
// //       };
// //       reader.readAsArrayBuffer(file);
// //     }
// //   }

//         import('office-viewer').then(async (officeViewer: any) => {
//           const office = await this.initOffice(officeViewer, data);
//           if (display !== false) {
//             office.render(this.rootElement?.current!);
//           } else if (display === false && this.rootElement?.current) {
//             // 设置为 false 后清空
//             this.rootElement.current.innerHTML = '';
//           }
//           this.office = office;
//         });
//       };
//       reader.readAsArrayBuffer(file);
//     }
//   }

// //         <Spinner
// //           overlay
// //           key="info"
// //           show={loading && this.state.loading}
// //           loadingConfig={loadingConfig}
// //         />
// //       </div>
// //     );
// //   }
// // }

// // @Renderer({
// //   type: 'office-viewer'
// // })
// // export class OfficeViewerRenderer extends OfficeViewer {
// //   static contextType = ScopedContext;

// //   constructor(props: OfficeViewerProps, context: IScopedContext) {
// //     super(props);

// //     const scoped = context;
// //     scoped.registerComponent(this);
// //   }

// //   componentWillUnmount() {
// //     super.componentWillUnmount?.();
// //     const scoped = this.context as IScopedContext;
// //     scoped.unRegisterComponent(this);
// //   }
// // }
