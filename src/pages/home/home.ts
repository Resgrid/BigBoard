import { Component } from '@angular/core';
import { NavController, MenuController, PopoverController, AlertController, Popover, ModalController, Modal } from 'ionic-angular';

import { Widget } from '../../models/widget';
import { WidgetProvider } from '../../widgets/widget-provider';
import { SettingsProvider } from '../../providers/settings';
import { SettingsPage } from '../settings/settings';

import { AddPopover } from '../../components/add-popover/add-popover';
import { AppPopover } from '../../components/app-popover/app-popover';

import { CallsModal } from '../../widgets/calls/calls-modal';

import { NgGrid, NgGridItem, NgGridConfig, NgGridItemConfig, NgGridItemEvent } from 'angular2-grid';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage {
	private areSettingsSet: boolean;
	private boxes: Array<Widget> = [];
	private addWidgetPopover: Popover;
	private appOptionsPopover: Popover;
	private widgetSettingsModal: Modal;

	public connected: boolean = false;
	public connectionTimestamp: string = "";

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
		'cascade': 'up',
		'min_width': 50,
		'min_height': 50,
		'fix_to_grid': false,
		'auto_style': true,
		'auto_resize': false,
		'maintain_ratio': false,
		'prefer_new': false,
		'zoom_on_drag': false,
		'limit_to_screen': true
	};

	constructor(private menu: MenuController,
		public navCtrl: NavController,
		private widgetProvider: WidgetProvider,
		private settingsProvider: SettingsProvider,
		private popoverCtrl: PopoverController,
		private alertCtrl: AlertController,
		private modalCtrl: ModalController) {
		this.areSettingsSet = this.settingsProvider.areSettingsSet();

		if (this.areSettingsSet) {
			this.settingsProvider.loadLayout().then((widgets) => {
				if (widgets) {
					this.boxes = widgets;
				}
			});
		}
	}

	ionViewDidEnter() {
		this.menu.swipeEnable(false);
	}

	setSettingsClick() {
		this.navCtrl.setRoot(SettingsPage);
	}

	presentAddPopover(ev) {
		this.addWidgetPopover = this.popoverCtrl.create(AddPopover,{
								addWidget: (type) => { this.addWidget(type); },
								addedWidgets: this.getActiveWidgets()
							});

		this.addWidgetPopover.present({
			ev: ev
		});
	}

	presentAppPopover(ev) {
		this.appOptionsPopover = this.popoverCtrl.create(AppPopover,{
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
			if (box.type == 1) {
				
			} else if (box.type == 2) {
				
			} else if (box.type == 3) {
				
			} else if (box.type == 4) {
				
			} else if (box.type == 5) {
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

		if (type == 1) {
			widgetType = 1;
			name = "Personnel";
		} else if (type == 2) {
			widgetType = 2;
			name = "Map";
		} else if (type == 3) {
			widgetType = 3;
			name = "Weather";
		} else if (type == 4) {
			widgetType = 4;
			name = "Units";
		} else if (type == 5) {
			widgetType = 5;
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
			if (this.boxes[_i]) {
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
		return { 'dragHandle': '.handle', 'col': 1, 'row': 1, 'sizex': 1, 'sizey': 1 };
	}
}
