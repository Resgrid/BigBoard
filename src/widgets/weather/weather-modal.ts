import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { Consts } from '../../app/consts';
import { WeatherWidgetSettings } from '../../models/weatherWidgetSettings';
import { WidgetPubSub } from '../../providers/widget-pubsub';

import { SettingsProvider } from '../../providers/settings';

@Component({
    selector: 'weather-modal',
    templateUrl: 'weather-modal.html'
})
export class WeatherModal {
    public model: WeatherWidgetSettings;
    private removeWidget;
    private closeModal;
    public units: string[];

    constructor(private navParams: NavParams,
        private consts: Consts,
        private settingsProvider: SettingsProvider,
        private widgetPubSub: WidgetPubSub) {
        this.removeWidget = this.navParams.get('removeWidget')
        this.closeModal = this.navParams.get('closeModal')

        this.model = new WeatherWidgetSettings();
        this.units = new Array<string>("US", "UK", "CA")
    }

    ngOnInit() {
        this.settingsProvider.loadWeatherWidgetSettings().then((settings) => {
            if (settings) {
                this.model = settings;
            }
        });
    }

    save() {
        this.settingsProvider.saveWeatherWidgetSettings(this.model).then(() => {
            this.widgetPubSub.emitWeatherWidgetSettingsUpdated(this.model);
            this.closeModal();
        });
    }

    remove() {
        this.removeWidget(this.consts.WIDGET_TYPES.WEATHER);
    }

    close() {
        this.closeModal();
    }
}