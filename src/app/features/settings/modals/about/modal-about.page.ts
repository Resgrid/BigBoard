import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { SettingsState } from '../../store/settings.store';
import * as SettingsActions from '../../actions/settings.actions';
import { StorageProvider } from 'src/app/providers/storage';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-modal-about',
  templateUrl: './modal-about.page.html',
  styleUrls: ['./modal-about.page.scss'],
})
export class ModalAboutPage implements OnInit {
  public serverAddress: string = '';
  public applicationVersion: string = '';

  constructor(
    private modal: ModalController,
    private store: Store<SettingsState>,
    private storageService: StorageProvider,
  ) {}

  ngOnInit() {
    this.storageService.getServerAddress().then((serverAddress) => {
      if (serverAddress) {
        this.serverAddress = serverAddress;
      } else {
        this.serverAddress = 'https://api.resgrid.com';
      }
    });

    this.applicationVersion = environment.version;
  }

  dismissModal() {
    this.modal.dismiss();
  }
}
