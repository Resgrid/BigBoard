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
import { DispatchedEventResult } from '../../models/dispatchedEventResult';

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

                    if (callData && this.hasGroupBeenDispatched(callData.Dispatches, Number(this.settingsProvider.settings.SelectedGroup))) {
                      var getUrl = window.location;
                      var baseUrl = getUrl .protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1];

                      if (this.settingsProvider.settings.EnableSounds) {
                        if (data.Aid && data.Aid.length > 0) {
                          var audio = new Audio();
                          audio.src = this.appConfig.ResgridApiUrl + '/Calls/GetCallAudio?query=' + encodeURIComponent(data.Aid);
                          audio.load();
                          audio.play();
                        } else {
                          var audio2 = new Audio();

                          if (callData.Priority.Id === 0) {
                            audio2.src = baseUrl + 'assets/audio/LowCall.mp3';
                          } else if (callData.Priority.Id === 1) {
                            audio2.src = baseUrl + 'assets/audio/MediumCall.mp3';
                          } else if (callData.Priority.Id === 2) {
                            audio2.src = baseUrl + 'assets/audio/HighCall.mp3';
                          } else if (callData.Priority.Id === 3) {
                            audio2.src = baseUrl + 'assets/audio/EmergencyCall.mp3';
                          } else {
                            audio2.src = baseUrl + 'assets/audio/custom/c' + callData.Priority.Tone + '.mp3';
                          }
                          
                          audio2.load();
                          audio2.play();
                        }
                      }

                      let toast = this.toastCtrl.create({
                        message: 'New Call: ' + data.Nme + ' logged ' + this.utilsProvider.getTimeAgo(data.Lon),
                        duration: 120000,
                        cssClass: 'danger',
                        position: 'bottom',

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

  private hasGroupBeenDispatched(dispatches: DispatchedEventResult[], groupId: number): boolean {
    if (!dispatches || dispatches.length <= 0) {
      return false;
    }

    let hasBeenDispatched = false;
    dispatches.forEach(dispatch => {
      if (dispatch && dispatch.GroupId === groupId) {
        hasBeenDispatched = true;
      }
    });

    return hasBeenDispatched;
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