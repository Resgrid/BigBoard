import { KtdGridLayout } from '@katoid/angular-grid-layout';
import { Action } from '@ngrx/store';
import { GroupResultData } from '@resgrid/ngx-resgridlib';
import { Widget } from 'src/app/models/widget';

export enum HomeActionTypes {
  START_SIGNALR = '[HOME] START_SIGNALR',
  STOP_SIGNALR = '[HOME] STOP_SIGNALR',
  UPDATE_SIGNALR_STATE = '[HOME] UPDATE_SIGNALR_STATE',
  ADD_WIDGET = '[HOME] ADD_WIDGET',
  CLOSE_MODAL = '[HOME] CLOSE_MODAL',
  UPDATE_WIDGET_LAYOUT = '[HOME] UPDATE_WIDGET_LAYOUT',
  REMOVE_WIDGET = '[HOME] REMOVE_WIDGET',
  REMOVE_WIDGET_DONE = '[HOME] REMOVE_WIDGET_DONE',
  SAVE_WIDGET_LAYOUT = '[HOME] SAVE_WIDGET_LAYOUT',
  LOAD_WIDGET_LAYOUT = '[HOME] LOAD_WIDGET_LAYOUT',
  LOAD_WIDGET_LAYOUT_DONE = '[HOME] LOAD_WIDGET_LAYOUT_DONE',

  GET_GROUPS = '[HOME] GET_GROUPS',
  GET_GROUPS_DONE = '[HOME] GET_GROUPS_DONE',
}

export class StartSignalR implements Action {
  readonly type = HomeActionTypes.START_SIGNALR;
  constructor() {}
}

export class StopSignalR implements Action {
  readonly type = HomeActionTypes.STOP_SIGNALR;
  constructor() {}
}

export class CloseModal implements Action {
  readonly type = HomeActionTypes.CLOSE_MODAL;
  constructor() {}
}

export class UpdateSignalrState implements Action {
  readonly type = HomeActionTypes.UPDATE_SIGNALR_STATE;
  constructor(public state: number) {} // 0 = disconnected, 1 = connecting, 2 = connected
}

export class AddWidget implements Action {
  readonly type = HomeActionTypes.ADD_WIDGET;
  constructor(public widget: Widget) {}
}

export class WidgetLayoutUpdated implements Action {
  readonly type = HomeActionTypes.UPDATE_WIDGET_LAYOUT;
  constructor(public layout: KtdGridLayout) {}
}

export class RemoveWidget implements Action {
  readonly type = HomeActionTypes.REMOVE_WIDGET;
  constructor(public id: string) {}
}

export class RemoveWidgetDone implements Action {
  readonly type = HomeActionTypes.REMOVE_WIDGET_DONE;
  constructor() {}
}

export class SaveWidgetLayout implements Action {
  readonly type = HomeActionTypes.SAVE_WIDGET_LAYOUT;
  constructor() {}
}

export class LoadWidgetLayout implements Action {
  readonly type = HomeActionTypes.LOAD_WIDGET_LAYOUT;
  constructor() {}
}

export class LoadWidgetLayoutDone implements Action {
  readonly type = HomeActionTypes.LOAD_WIDGET_LAYOUT_DONE;
  constructor(public widgets: Widget[]) {}
}

export class GetGroups implements Action {
  readonly type = HomeActionTypes.GET_GROUPS;
  constructor() {}
}

export class GetGroupsDone implements Action {
  readonly type = HomeActionTypes.GET_GROUPS_DONE;
  constructor(public groups: GroupResultData[]) {}
}

export type HomeActionsUnion =
  | StartSignalR
  | StopSignalR
  | UpdateSignalrState
  | CloseModal
  | AddWidget
  | RemoveWidget
  | WidgetLayoutUpdated
  | SaveWidgetLayout
  | LoadWidgetLayout
  | LoadWidgetLayoutDone
  | GetGroups
  | GetGroupsDone
  | RemoveWidgetDone;
