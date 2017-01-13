import { Component } from '@angular/core';
import { NavController, MenuController } from 'ionic-angular';

import { Widget } from '../../models/widget';
import { WidgetProvider } from '../../widgets/widget-provider';
import { SettingsProvider } from '../../providers/settings';

import { NgGrid, NgGridItem, NgGridConfig, NgGridItemConfig, NgGridItemEvent } from 'angular2-grid';

@Component({
	selector: 'page-home',
	templateUrl: 'home.html'
})
export class HomePage {
	private areSettingsSet: boolean;
	private boxes: Array<Widget> = [];
	private rgb: string = '#efefef';
	private curNum;
	private gridConfig: NgGridConfig = <NgGridConfig>{
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
	private itemPositions: Array<any> = [];

	constructor(private menu: MenuController, 
				public navCtrl: NavController, 
				private widgetProvider: WidgetProvider, 
				private settingsProvider: SettingsProvider) {
		this.areSettingsSet = false;

		const dashconf = this._generateDefaultDashConfig();
		for (var i = 0; i < dashconf.length; i++) {
			const conf = dashconf[i];
			conf.payload = 1 + i;
			this.boxes[i] = { name: "test", type: 1, templateString: widgetProvider.getCallWidgetTemplate(), id: i + 1, config: conf };
		}
		this.curNum = dashconf.length + 1;
	}

	ionViewDidEnter() {
		this.menu.swipeEnable(false);
	}

	addBox(): void {
		const conf: NgGridItemConfig = this._generateDefaultItemConfig();
		conf.payload = this.curNum++;
		this.boxes.push({ name: "test", type: 1, templateString: "", id: conf.payload, config: conf });
	}

	removeWidget(index: number): void {
		if (this.boxes[index]) {
			this.boxes.splice(index, 1);
		}
	}

	updateItem(index: number, event: NgGridItemEvent): void {
		// Do something here
	}

	onDrag(index: number, event: NgGridItemEvent): void {
		// Do something here
	}

	onResize(index: number, event: NgGridItemEvent): void {
		// Do something here
	}

	private _generateDefaultItemConfig(): NgGridItemConfig {
		return { 'dragHandle': '.handle', 'col': 1, 'row': 1, 'sizex': 1, 'sizey': 1 };
	}

	private _generateDefaultDashConfig(): NgGridItemConfig[] {
		return [{ 'dragHandle': '.handle', 'col': 1, 'row': 1, 'sizex': 50, 'sizey': 40 },
		{ 'dragHandle': '.handle', 'col': 1, 'row': 1, 'sizex': 1, 'sizey': 1 },
		{ 'dragHandle': '.handle', 'col': 26, 'row': 1, 'sizex': 1, 'sizey': 1 },
		{ 'dragHandle': '.handle', 'col': 51, 'row': 1, 'sizex': 75, 'sizey': 1 },
		{ 'dragHandle': '.handle', 'col': 51, 'row': 26, 'sizex': 32, 'sizey': 40 },
		{ 'dragHandle': '.handle', 'col': 83, 'row': 26, 'sizex': 1, 'sizey': 1 }];
	}
}
