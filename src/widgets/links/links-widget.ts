import { Component } from '@angular/core';

import { DepartmentLinkResult } from '../../models/departmentLinkResult';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';

import { SettingsProvider } from '../../providers/settings'

@Component({
  selector: 'links-widget',
  templateUrl: 'links-widget.html'
})
export class LinksWidget {
  public links: DepartmentLinkResult[];

  constructor(private dataProvider: DataProvider,
              private widgetPubSub: WidgetPubSub,
              private settingsProvider: SettingsProvider) {

  }

  ngOnInit() {
    this.fetch();
  }

  private fetch() {
    this.dataProvider.getLinkedDepartments().subscribe(
      data => {
        this.links = data;
      });
  }
}