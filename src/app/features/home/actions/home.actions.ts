import { KtdGridLayout } from '@katoid/angular-grid-layout';
import { Action } from '@ngrx/store';
import { Widget } from 'src/app/models/widget';

export enum HomeActionTypes {
  START_SIGNALR = '[HOME] START_SIGNALR',
  STOP_SIGNALR = '[HOME] STOP_SIGNALR',
  UPDATE_SIGNALR_STATE = '[HOME] UPDATE_SIGNALR_STATE',
  ADD_WIDGET = '[HOME] ADD_WIDGET',
  CLOSE_MODAL = '[HOME] CLOSE_MODAL',
  UPDATE_WIDGET_LAYOUT = '[HOME] UPDATE_WIDGET_LAYOUT',
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
  constructor(public state: number) {}  // 0 = disconnected, 1 = connecting, 2 = connected
}

export class AddWidget implements Action {
  readonly type = HomeActionTypes.ADD_WIDGET;
  constructor(public widget: Widget) {}
}

export class WidgetLayoutUpdated implements Action {
  readonly type = HomeActionTypes.UPDATE_WIDGET_LAYOUT;
  constructor(public layout: KtdGridLayout) {}
}

export type HomeActionsUnion =
  | StartSignalR
  | StopSignalR
  | UpdateSignalrState
  | CloseModal
  | AddWidget
  | WidgetLayoutUpdated
  ;
