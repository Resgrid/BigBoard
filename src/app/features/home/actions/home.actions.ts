import { Action } from '@ngrx/store';

export enum HomeActionTypes {
  CLOSE_MODAL = '[HOME] CLOSE_MODAL',
}

export class CloseModal implements Action {
  readonly type = HomeActionTypes.CLOSE_MODAL;
  constructor() {}
}


export type HomeActionsUnion =
  | CloseModal
  ;
