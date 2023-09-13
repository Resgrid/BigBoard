import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { passwordValidator } from 'src/app/validators/password.validator';
import { SettingsState } from '../../store/settings.store';
import * as SettingsActions from '../../actions/settings.actions';

@Component({
  selector: 'app-modal-confirmLogout',
  templateUrl: './modal-confirmLogout.page.html',
  styleUrls: ['./modal-confirmLogout.page.scss'],
})
export class ModalConfirmLogoutPage implements OnInit {
  constructor(
    private modal: ModalController,
    private store: Store<SettingsState>,
  ) {}

  ngOnInit() {}

  dismissModal() {
    this.modal.dismiss();
  }

  logout() {
    this.store.dispatch(new SettingsActions.Logout());
  }
}
