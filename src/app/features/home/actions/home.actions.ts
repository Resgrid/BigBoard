import { Action } from '@ngrx/store';

export enum HomeActionTypes {
  START_SIGNALR = '[HOME] START_SIGNALR',
  STOP_SIGNALR = '[HOME] STOP_SIGNALR',
  UPDATE_SIGNALR_STATE = '[HOME] UPDATE_SIGNALR_STATE',
  CLOSE_MODAL = '[HOME] CLOSE_MODAL',
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


export type HomeActionsUnion =
  | StartSignalR
  | StopSignalR
  | UpdateSignalrState
  | CloseModal
  ;
