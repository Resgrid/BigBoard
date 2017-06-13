import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
//import { Device } from 'ionic-native';
import { Platform } from 'ionic-angular';

@Injectable()
export class UtilsProvider {

  constructor(private platform: Platform) {

  }

  public isDevice(): boolean {
    if (this.platform.is('ios') || this.platform.is('android') || this.platform.is('windows')) {
      return true;
    }
    
    return false;
  }
}