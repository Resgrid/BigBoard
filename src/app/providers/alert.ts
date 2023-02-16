import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class AlertProvider {
  constructor(private alertCtrl: AlertController) {}

  public async showOkAlert(title: string, subTitle: string, body: string) {
    const alert = await this.alertCtrl.create({
      //cssClass: 'my-custom-class',
      header: title,
      subHeader: subTitle,
      message: body,
      buttons: ['OK'],
    });

    await alert.present();
  }

  public async showErrorAlert(title: string, subTitle: string, body: string) {
    const alert = await this.alertCtrl.create({
      //cssClass: 'my-custom-class',
      header: title,
      subHeader: subTitle,
      message: body,
      buttons: ['OK'],
    });

    await alert.present();
  }

  public showAutoCloseSuccessAlert(title: string) {}
}
