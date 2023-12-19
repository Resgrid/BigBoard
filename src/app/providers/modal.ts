import { Injectable } from '@angular/core';
import { MenuController, ModalController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class ModalProvider {
  constructor(
    private menuCtrl: MenuController,
    private modalCtrl: ModalController,
  ) {}

  public async runModal(
    component,
    cssClass,
    properties,
    id,
    opts = {},
  ): Promise<void> {
    await this.menuCtrl.close();

    if (!cssClass) {
      cssClass = 'modal-container';
    }

    if (!id) {
      id = 'ModalProviderModal';
    }

    const modalRef = await this.modalCtrl.create({
      component: component,
      cssClass: cssClass,
      componentProps: properties,
      id: id,
      ...opts,
    });

    return modalRef.present();
  }

  public async closeModal(id) {
    if (!id) {
      id = 'ModalProviderModal';
    }

    try {
      var activeModal = await this.modalCtrl.getTop();

      if (activeModal) {
        await this.modalCtrl.dismiss(null, undefined, id);
      }
    } catch (error) {}
  }
}
