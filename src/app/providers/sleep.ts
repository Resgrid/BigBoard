import { Injectable } from '@angular/core';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Platform } from '@ionic/angular';
import { StorageProvider } from './storage';

@Injectable({
  providedIn: 'root',
})
export class SleepProvider {
  constructor(private storageProvider: StorageProvider, public platform: Platform) {}

  public async init(): Promise<boolean> {

    if (this.platform.is('mobile')) {
      let keepAlive = await this.storageProvider.getKeepAlive();
      if (keepAlive) {
        await KeepAwake.keepAwake();
        console.log('SleepProvider: keep awake enabled');
        return true;
      } else {
        await KeepAwake.allowSleep();
        console.log('SleepProvider: keep awake disabled');
        return false;
      }
    }

    return false;
  }

  public async enable() {
    if (this.platform.is('mobile')) {
      await KeepAwake.keepAwake();
    }
  }

  public async disable() {
    if (this.platform.is('mobile')) {
      await KeepAwake.allowSleep();
    }
  }
}
