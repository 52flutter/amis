import {
  BasePlugin,
  EditorManager,
  RendererPluginEvent,
  getSchemaTpl,
} from 'amis-editor-core';
import { getEventControlConfig } from 'amis-editor/lib/renderer/event-control/helper';
import { toAmis, toAmisEvent } from './editorParser';

export function getBasePlugins(
  meta: any,
  opts: {
    scene?: string[];
    id?: string;
    rendererName: string;
    name: string;
    panelTitle?: string;
    order?: number;
    icon?: string;
    pluginIcon?: string;
    panelIcon?: string;
    description?: string;
    isBaseComponent?: boolean;
  } = { scene: ['layout'], name: 'gen', id: 'gen', rendererName: 'gen' }
) {
  return class extends BasePlugin {
    // 是否是系统组件
    isBaseComponent = opts.isBaseComponent ?? true;

    static scene = opts?.scene;

    static id = opts?.id ?? opts?.rendererName;
    // 关联渲染器名字
    rendererName = opts?.rendererName;

    $schema = '/schemas/UnkownSchema.json';

    name = opts?.name;
    order = -399;

    panelTitle = opts?.panelTitle ?? opts?.name;

    icon = opts?.icon;

    pluginIcon = opts?.pluginIcon;

    panelIcon = opts?.panelIcon;

    description = opts?.description ?? opts?.name;

    scaffold: any = {
      type: opts?.rendererName,
    };

    previewSchema = {
      type: opts?.rendererName,
    };

    // 右侧属性面板配置项
    panelBodyCreator = (context: any) => {
      return getSchemaTpl('tabs', [
        {
          title: '属性',
          className: 'p-none',
          body: getSchemaTpl('collapseGroup', [
            {
              title: '基本',
              body: [
                ...toAmis(
                  { eventCtx: context, plugin: this },
                  meta?.configure?.props ?? []
                ),
              ],
            },
            getSchemaTpl('status', {
              disabled: true,
            }),
          ]),
        },

        {
          title: '外观',
          className: 'p-none',
          body: getSchemaTpl('collapseGroup', [
            {
              title: '自定义样式',
              body: [
                {
                  type: 'theme-cssCode',
                  label: false,
                },
              ],
            },
          ]),
        },
        {
          title: '事件',
          className: 'p-none',
          body: [
            getSchemaTpl('eventControl', {
              name: 'onEvent',
              ...getEventControlConfig(this.manager, context),
              // rawType: 'button',
            }),
          ],
        },
      ]);
    };
    // 事件定义
    events: RendererPluginEvent[] = [];
    constructor(manager: EditorManager) {
      super(manager);
      this.events = toAmisEvent(meta?.configure?.supports?.events as any);
    }
  };
}
