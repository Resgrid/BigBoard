import { Component, ViewChild, ElementRef, Input, OnInit } from '@angular/core';
import { OnMount } from 'ng-dynamic';

import { Widget } from '../../models/widget';

@Component({
  selector: 'calls-widget',
  templateUrl: 'calls-widget.html'
})
export class CallsWidget implements OnMount, OnInit {
  @Input() widget: Widget;
  @ViewChild('innerContent') innerContent: ElementRef;

  constructor() {

  }

  dynamicOnMount(attr: Map<string, string>, innerHTML: string, el: any) {
    //this.msg = attr.get('msg');
    this.innerContent.nativeElement.innerHTML = innerHTML;
    //console.log(`onMount: ${this.msg}`);
  }

  ngOnInit() {
    //console.log(`onInit: ${this.msg}`);
  }

  onClick() {
    //console.log(`clicked: ${this.msg}`);
  }
}
