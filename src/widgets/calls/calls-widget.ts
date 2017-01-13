import { Component, ViewChild, ElementRef, Input, OnInit } from '@angular/core';

import { CallResult } from '../../models/callResult';

import { DataProvider } from '../../providers/data';

@Component({
  selector: 'calls-widget',
  templateUrl: 'calls-widget.html'
})
export class CallsWidget {
  public calls: CallResult[];

  constructor(private dataProvider: DataProvider) {
    this.fetch();
  }

  private fetch() {
    this.dataProvider.getCalls().subscribe(
      data => {
        this.calls = data;
      });
  }
}