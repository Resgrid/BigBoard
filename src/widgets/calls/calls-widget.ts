import { Component, Inject } from '@angular/core';

import { APP_CONFIG_TOKEN, AppConfig } from "../../config/app.config-interface";

import { DepartmentLinkResult } from '../../models/departmentLinkResult';
import { CallResult } from '../../models/callResult';
import { CallsWidgetSettings } from '../../models/callsWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';
import { DataProvider } from '../../providers/data';

import { SettingsProvider } from '../../providers/settings';
import { CallsProvider } from '../../providers/calls';
import { ToastController } from 'ionic-angular';
import { UtilsProvider } from '../../providers/utils';

@Component({
  selector: 'calls-widget',
  templateUrl: 'calls-widget.html'
})
export class CallsWidget {
  public calls: CallResult[];
  public linkedCalls: CallResult[];
  public links: DepartmentLinkResult[];
  public settings: CallsWidgetSettings;
  private settingsUpdatedSubscription: any;

  constructor(private dataProvider: DataProvider,
    private widgetPubSub: WidgetPubSub,
    private callsProvider: CallsProvider,
    private toastCtrl: ToastController,
    private utilsProvider: UtilsProvider,
    @Inject(APP_CONFIG_TOKEN) private appConfig: AppConfig,
    private settingsProvider: SettingsProvider) {
    this.settings = new CallsWidgetSettings();
  }

  ngOnInit() {
    this.dataProvider.getLinkedDepartments().subscribe(
      data => {
        this.links = data;
        this.fetchLinkedCalls();
      });

    this.settingsProvider.loadCallWidgetSettings().then((settings) => {
      if (settings) {
        this.settings = settings;
      }
      this.fetch();
    });

    this.settingsUpdatedSubscription = this.widgetPubSub.watch().subscribe(e => {
      if (e.event === this.widgetPubSub.EVENTS.CALLS_SETTINGS) {
        this.settings = e.data;
      } else if (e.event === this.widgetPubSub.EVENTS.CALL_STATUS_UPDATED) {
        this.fetch();

        if (e.data && this.settingsProvider.settings.SelectedGroup != "0") {
          this.callsProvider.getCall(e.data).subscribe(
            data => {

              if (data) {
                this.callsProvider.getCallData(e.data).subscribe(
                  callData => {

                    if (callData && callData.hasGroupBeenDispatched(e.data)) {
                      if (data.Aid && data.Aid.length > 0 && this.settingsProvider.settings.EnableSounds) {
                        var audio = new Audio();
                        audio.src = this.appConfig.ResgridApiUrl + '/Calls/GetCallAudio?query=' + encodeURIComponent(data.Aid);
                        audio.load();
                        audio.play();
                      }

                      let toast = this.toastCtrl.create({
                        message: 'New Call: ' + data.Nme + ' logged ' + this.utilsProvider.getTimeAgoUtc(data.Utc),
                        duration: 120000,
                        position: 'bottom'
                      });

                      toast.onDidDismiss(() => {

                      });

                      toast.present();
                    }
                  },
                  callDataErr => {

                  });
              }
            },
            err => {

            });
        }
      }
    });
  }

  private fetch() {
    this.dataProvider.getCalls().subscribe(
      data => {
        this.calls = data;

        if (this.linkedCalls != undefined)
          this.calls = this.calls.concat(this.linkedCalls);
      });

    this.fetchLinkedCalls();
  }

  private fetchLinkedCalls() {
    if (this.settings.ShowLinkedCalls) {
      this.dataProvider.getAllLinkedCalls().subscribe(
        data => {
          this.linkedCalls = data;

          if (this.linkedCalls != undefined) {
            if (this.calls != undefined)
              this.calls = this.calls.concat(this.linkedCalls);
            else
              this.calls = this.linkedCalls;
          }
        });
    }
  }
}