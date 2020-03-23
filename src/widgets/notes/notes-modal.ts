import { Component } from '@angular/core';
import { NavParams } from 'ionic-angular';

import { Consts } from '../../app/consts';
import { WidgetPubSub } from '../../providers/widget-pubsub';

import { SettingsProvider } from '../../providers/settings';
import { NotesWidgetSettings } from '../../models/notesWidgetSettings';
import { DataProvider } from '../../providers/data';

@Component({
    selector: 'notes-modal',
    templateUrl: 'notes-modal.html'
})
export class NotesModal {
    public model: NotesWidgetSettings;
    private removeWidget;
    private closeModal;
    public categories: string[] = new Array<string>();

    constructor(private navParams: NavParams,
        private consts: Consts,
        private settingsProvider: SettingsProvider,
        private widgetPubSub: WidgetPubSub,
        private dataProvider: DataProvider) {
        this.removeWidget = this.navParams.get('removeWidget')
        this.closeModal = this.navParams.get('closeModal')

        this.model = new NotesWidgetSettings();
        this.categories.push('None');
    }

    ngOnInit() {
        this.settingsProvider.loadNotesWidgetSettings().then((settings) => {
            if (settings) {
                this.model = settings;
            }
        });

        this.dataProvider.getNoteCategories().subscribe(categoryStrings => {
            if (categoryStrings) {
                categoryStrings.forEach(category => {
                    this.categories.push(category);
                });
            }
        });
    }

    save() {
        this.settingsProvider.saveNotesWidgetSettings(this.model).then(() => {
            this.widgetPubSub.emitNotesWidgetSettingsUpdated(this.model);
            this.closeModal();
        });
    }

    remove() {
        this.removeWidget(this.consts.WIDGET_TYPES.NOTES);
    }

    close() {
        this.closeModal();
    }
}