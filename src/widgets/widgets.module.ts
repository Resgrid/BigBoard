import { NgModule } from '@angular/core';
import { MomentModule } from 'angular2-moment';
import { CommonModule } from '@angular/common';
import { CallsWidget } from '../widgets/calls/calls-widget';

@NgModule({
  imports: [
    CommonModule,
    MomentModule
  ],
  declarations: [
    CallsWidget
  ],
  exports: [
    CallsWidget
  ]
})
export class WidgetsModule { }