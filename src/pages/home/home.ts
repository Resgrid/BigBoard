import { Component, ViewEncapsulation } from '@angular/core';
import { NavController, MenuController, PopoverController, AlertController, Popover, ModalController, Modal } from 'ionic-angular';
import { Observable } from "rxjs/Observable";

import { Consts } from '../../app/consts';
import { Widget } from '../../models/widget';
import { SettingsProvider } from '../../providers/settings';
import { SettingsPage } from '../settings/settings';

import { ChannelProvider, ConnectionState } from '../../providers/channel';

import { AddPopover } from '../../components/add-popover/add-popover';
import { AppPopover } from '../../components/app-popover/app-popover';

import { CallsModal } from '../../widgets/calls/calls-modal';
import { UnitsModal } from '../../widgets/units/units-modal';
import { PersonnelModal } from '../../widgets/personnel/personnel-modal';
import { WeatherModal } from '../../widgets/weather/weather-modal';
import { MapModal } from '../../widgets/map/map-modal';

import { NgGrid, NgGridItem, NgGridConfig, NgGridItemConfig, NgGridItemEvent } from 'angular2-grid';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html',
	encapsulation: ViewEncapsulation.None
})
export class HomePage {
	private areSettingsSet: boolean;
	private boxes: Array<Widget> = [];
	private addWidgetPopover: Popover;
	private appOptionsPopover: Popover;
	private widgetSettingsModal: Modal;

	public connected: boolean = false;
	public status: string = "Connecting to Resgrid...";
	public statusColor: string = "orange";
	public connectionTimestamp: Date = new Date();

	private curNum;
	public gridConfig: NgGridConfig = <NgGridConfig>{
		'margins': [5],
		'draggable': true,
		'resizable': true,
		'max_cols': 0,
		'max_rows': 0,
		'visible_cols': 0,
		'visible_rows': 0,
		'min_cols': 1,
		'min_rows': 1,
		'col_width': 2,
		'row_height': 2,
		'cascade': 'left',
		'min_width': 50,
		'min_height': 50,
		'fix_to_grid': false,
		'auto_style': true,
		'auto_resize': false,
		'maintain_ratio': false,
		'prefer_new': false,
		'zoom_on_drag': false,
		'limit_to_screen': false
	};

	constructor(private menu: MenuController,
		public navCtrl: NavController,
		private consts: Consts,
		private settingsProvider: SettingsProvider,
		private popoverCtrl: PopoverController,
		private alertCtrl: AlertController,
		private modalCtrl: ModalController,
		private channelProvider: ChannelProvider) {
		this.areSettingsSet = this.settingsProvider.areSettingsSet();

		if (this.areSettingsSet) {
			this.settingsProvider.loadLayout().then((widgets) => {
				if (widgets) {
					this.boxes = widgets;
				}
			});
		}
	}

	ngOnInit() {
		this.wireUpSignalRListeners();
	}

	ionViewDidEnter() {
		this.menu.swipeEnable(false);

		if (this.settingsProvider.areSettingsSet()) {
			this.channelProvider.start();
		}
	}

	setSettingsClick() {
		this.navCtrl.setRoot(SettingsPage);
	}

	presentAddPopover(ev) {
		this.addWidgetPopover = this.popoverCtrl.create(AddPopover, {
			addWidget: (type) => { this.addWidget(type); },
			addedWidgets: this.getActiveWidgets()
		});

		this.addWidgetPopover.present({
			ev: ev
		});
	}

	presentAppPopover(ev) {
		this.appOptionsPopover = this.popoverCtrl.create(AppPopover, {
			saveLayout: () => { this.saveLayout(); },
			loadLayout: () => { this.loadLayout(); },
			clearLayout: () => { this.clearLayout(); }
		});

		this.appOptionsPopover.present({
			ev: ev
		});
	}

	public openWidgetSettings(box: Widget) {
		if (box) {
			if (box.type == this.consts.WIDGET_TYPES.PERSONNEL) {
				this.widgetSettingsModal = this.modalCtrl.create(PersonnelModal, {
					removeWidget: (type) => { this.removeWidgetByType(type); },
					closeModal: () => { this.closeWidgetSettingsModal(); }
				});
				this.widgetSettingsModal.present();
			} else if (box.type == this.consts.WIDGET_TYPES.MAP) {
				this.widgetSettingsModal = this.modalCtrl.create(MapModal, {
					removeWidget: (type) => { this.removeWidgetByType(type); },
					closeModal: () => { this.closeWidgetSettingsModal(); }
				});
				this.widgetSettingsModal.present();
			} else if (box.type == this.consts.WIDGET_TYPES.WEATHER) {
				this.widgetSettingsModal = this.modalCtrl.create(WeatherModal, {
					removeWidget: (type) => { this.removeWidgetByType(type); },
					closeModal: () => { this.closeWidgetSettingsModal(); }
				});
				this.widgetSettingsModal.present();
			} else if (box.type == this.consts.WIDGET_TYPES.UNITS) {
				this.widgetSettingsModal = this.modalCtrl.create(UnitsModal, {
					removeWidget: (type) => { this.removeWidgetByType(type); },
					closeModal: () => { this.closeWidgetSettingsModal(); }
				});
				this.widgetSettingsModal.present();
			} else if (box.type == this.consts.WIDGET_TYPES.CALLS) {
				this.widgetSettingsModal = this.modalCtrl.create(CallsModal, {
					removeWidget: (type) => { this.removeWidgetByType(type); },
					closeModal: () => { this.closeWidgetSettingsModal(); }
				});
				this.widgetSettingsModal.present();
			}
		}
	}

	private closeWidgetSettingsModal(): void {
		if (this.widgetSettingsModal) {
			this.widgetSettingsModal.dismiss();
			this.widgetSettingsModal = null;
		}
	}

	addWidget(type): void {
		const conf: NgGridItemConfig = this._generateDefaultItemConfig();
		conf.payload = this.curNum++;

		let name: string;
		let widgetType: number;

		if (type == this.consts.WIDGET_TYPES.PERSONNEL) {
			widgetType = this.consts.WIDGET_TYPES.PERSONNEL;
			name = "Personnel";
		} else if (type == this.consts.WIDGET_TYPES.MAP) {
			widgetType = this.consts.WIDGET_TYPES.MAP;
			name = "Map";
		} else if (type == this.consts.WIDGET_TYPES.WEATHER) {
			widgetType = this.consts.WIDGET_TYPES.WEATHER;
			name = "Weather";
		} else if (type == this.consts.WIDGET_TYPES.UNITS) {
			widgetType = this.consts.WIDGET_TYPES.UNITS;
			name = "Units";
		} else if (type == this.consts.WIDGET_TYPES.CALLS) {
			widgetType = this.consts.WIDGET_TYPES.CALLS;
			name = "Calls";
		}

		this.boxes.push({ name: name, type: widgetType, templateString: "", id: conf.payload, config: conf });
		this.addWidgetPopover.dismiss();
	}

	removeWidget(index: number): void {
		if (this.boxes[index]) {
			this.boxes.splice(index, 1);
		}
	}

	removeWidgetByType(type: number): void {
		for (var _i = 0; _i < this.boxes.length; _i++) {
			if (this.boxes[_i].type == type) {
				this.boxes.splice(_i, 1);
				break;
			}
		}

		this.closeWidgetSettingsModal();
	}

	private getActiveWidgets(): string {
		let activeWidgets: string;

		this.boxes.forEach(box => {
			if (activeWidgets) {
				activeWidgets = activeWidgets + "," + box.type
			} else {
				activeWidgets = box.type.toString();
			}
		});

		return activeWidgets;
	}


	private saveLayout() {
		this.settingsProvider.saveLayout(this.boxes).then(() => {
			let alert = this.alertCtrl.create({
				title: 'Layout',
				subTitle: 'Your current layout has been saved.',
				buttons: ['Dismiss']
			});
			alert.present();
			this.appOptionsPopover.dismiss();
		});
	}

	private loadLayout() {
		this.settingsProvider.loadLayout().then((widgets) => {
			this.boxes = widgets;
			this.appOptionsPopover.dismiss();
		});
	}

	private clearLayout() {
		this.boxes = [];
		this.settingsProvider.clearLayout();
		this.appOptionsPopover.dismiss();
	}

	private _generateDefaultItemConfig(): NgGridItemConfig {
		return { 'dragHandle': '.handle', /*'resizeHandle': '.resizeGripHandle',*/ 'col': 1, 'row': 1, 'sizex': 1, 'sizey': 1 };
	}

	private wireUpSignalRListeners(): void {
		this.channelProvider.connectionState$.subscribe((state: ConnectionState) => {
			this.processConnectionUpdate(state);
		});

		//.map((state: ConnectionState) => { this.processConnectionUpdate(state); });

		this.channelProvider.error$.subscribe(
			(error: any) => { console.warn(error); },
			(error: any) => { console.error("errors$ error", error); }
		);

		this.channelProvider.starting$.subscribe(
			() => { console.log("signalr service has been started"); },
			() => { console.warn("signalr service failed to start!"); }
		);
	}

	private processConnectionUpdate(state: ConnectionState): void {
		switch (state) {
			case ConnectionState.Connecting:
				this.connected = false;
				this.status = "Connecting to Resgrid...";
				this.statusColor = "orange";
				break;
			case ConnectionState.Connected:
				this.status = "Connected to Resgrid";
				this.statusColor = "green";
				this.connected = true;
				break;
			case ConnectionState.Reconnecting:
				this.status = "Disconnected, attempting to reconnect to Resgrid...";
				this.statusColor = "orange";
				this.connected = false;
				break;
			case ConnectionState.Disconnected:
				this.connected = false;
				this.status = "Disconnected, attempting to reconnect to Resgrid...";
				this.statusColor = "red";
				break;
		}
	}
}
