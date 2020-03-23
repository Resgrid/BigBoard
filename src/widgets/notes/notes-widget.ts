import { Component } from '@angular/core';

import { WeatherWidgetSettings } from '../../models/weatherWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';

import { Geolocation } from 'ionic-native';
import { SettingsProvider } from '../../providers/settings'
import { NotesWidgetSettings } from '../../models/notesWidgetSettings';
import { NotesResult } from '../../models/notesResult';

@Component({
  selector: 'notes-widget',
  templateUrl: 'notes-widget.html'
})
export class NotesWidget {
  public settings: NotesWidgetSettings;
  public source: string = "";
  private settingsUpdatedSubscription: any;
  private intervalId;
  public notes: NotesResult[];

  constructor(private dataProvider: DataProvider,
    private widgetPubSub: WidgetPubSub,
    private settingsProvider: SettingsProvider) {
    this.settings = new NotesWidgetSettings();
  }

  ngOnInit() {
     this.settingsProvider.loadNotesWidgetSettings().then((settings) => {
      if (settings) {
        this.settings = settings;
      }

      this.getNotes();
    });

    this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
      if (e.event === this.widgetPubSub.EVENTS.NOTES_SETTINGS) {
        this.settings = e.data;
        this.getNotes();
      }
    });

    this.intervalId = setInterval(() => {
      this.getNotes();
    }, 3600000);
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  getNotes() {
    this.dataProvider.getNotes(this.settings.Category, this.settings.IncludeUnCategorized).subscribe(
      data => {
        this.notes = data;
      });
  }
}