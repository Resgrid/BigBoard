import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Store } from '@ngrx/store';
import { passwordValidator } from 'src/app/validators/password.validator';
import { SettingsState } from '../../store/settings.store';
import * as SettingsActions from '../../actions/settings.actions';

@Component({
  selector: 'app-modal-login',
  templateUrl: './modal-login.page.html',
  styleUrls: ['./modal-login.page.scss'],
})
export class ModalLoginPage implements OnInit {
  public loginForm: FormGroup;

  constructor(
    private modal: ModalController,
    private formBuilder: FormBuilder,
    private store: Store<SettingsState>,
  ) {
    this.loginForm = this.formBuilder.group({
      username: [null, [Validators.required]],
      password: [null, [Validators.required, passwordValidator]],
    });
  }

  ngOnInit() {}

  dismissModal() {
    this.modal.dismiss();
  }

  signIn() {
    if (this.loginForm.valid) {
      this.store.dispatch(new SettingsActions.IsLogin());

      const authData = {
        username: this.f.username.value.trim(),
        password: this.f.password.value.trim(),
      };

      this.store.dispatch(new SettingsActions.Login(authData));
    } else {
      console.log('invalid');
    }
  }

  get f() {
    return this.loginForm.controls;
  }
}
