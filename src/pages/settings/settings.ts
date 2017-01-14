import { Component } from '@angular/core';
import { NavController, LoadingController, AlertController } from 'ionic-angular';

import { Consts } from '../../app/consts';
import { Settings } from '../../models/settings';
import { SettingsProvider } from '../../providers/settings';
import { AuthProvider } from '../../providers/auth';
import { HomePage } from '../home/home';

@Component({
  selector: 'page-settings',
  templateUrl: 'settings.html'
})
export class SettingsPage {
  public settings: Settings;
  public saving: boolean = false;
  public demoMode: boolean = false;

  constructor(public navCtrl: NavController,
    private consts: Consts,
    private settingsProvider: SettingsProvider,
    private authProvider: AuthProvider,
    public loadingCtrl: LoadingController,
    private alertCtrl: AlertController) {
    this.settings = settingsProvider.settings;
    this.demoMode = consts.IsDemo;
  }

  onSignup(form) {
    this.saving = true;

    if (form.valid) {
      let loading = this.loadingCtrl.create({
        spinner: 'hide',
        content: 'Validating your settings, Please Wait...'
      });
      loading.present();

      this.authProvider.login(this.settings.Username, this.settings.Password).subscribe(
        data => {
          this.saving = false;

          this.settingsProvider.settings = this.settings;
          this.settingsProvider.settings.EmailAddress = data.Eml;
          this.settingsProvider.settings.DepartmentName = data.Dnm;
          this.settingsProvider.settings.DepartmentId = data.Did;
          this.settingsProvider.settings.DepartmentCreatedOn = data.Dcd;
          this.settingsProvider.settings.UserId = data.Uid;
          this.settingsProvider.settings.AuthToken = data.Tkn;
          this.settingsProvider.settings.AuthTokenExpiry = data.Txd;
          this.settingsProvider.save();

          loading.dismiss();

        },
        error => {
          loading.dismiss();
          this.saving = false;

          let alert = this.alertCtrl.create({
            title: 'Login Error',
            subTitle: 'Your Username or Password is incorrect, remember they are case sensitive. If you cannot remember you login or password go to resgrid.com and recover it.',
            buttons: ['Dismiss']
          });
          alert.present();
        });
    }
  }

}
