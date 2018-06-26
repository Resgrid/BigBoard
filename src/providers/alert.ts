import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';

@Injectable()
export class AlertProvider {
  private alert;

  constructor(public alertCtrl: AlertController) {

  }

  showOkAlert(title: string, subTitle: string) {
    this.alert = this.alertCtrl.create({
      title: title,
      subTitle: subTitle,
      buttons: ['OK']
    }).present();
  }

  showNewCall(title: string, subTitle: string) {
    this.alert = this.alertCtrl.create({
      title: title,
      subTitle: subTitle,
      buttons: ['View', 'Respond', 'Ok']
    }).present();
  }
}