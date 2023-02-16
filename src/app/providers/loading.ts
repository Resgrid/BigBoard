import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class LoadingProvider {
  private spinner: HTMLIonLoadingElement | null;

  constructor(private loadingCtrl: LoadingController) {}

  // Show loading
  public async show() {
    this.spinner = await this.loadingCtrl.create({
      //cssClass: 'my-custom-class',
      message: 'Please wait...',
    });
    await this.spinner.present();
  }

  // Hide loading
  public async hide() {
    if (this.spinner) {
      await this.loadingCtrl.dismiss();
      this.spinner = null;
    }
  }
}
