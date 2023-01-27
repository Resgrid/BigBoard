import { Injectable } from '@angular/core';
import { Howl, Howler } from 'howler';

@Injectable({
  providedIn: 'root',
})
export class AudioProvider {

  constructor() {}

  public playTransmitStart() {
    const host = location.protocol + '//' + location.host;

    let sound = new Howl({
      src: ['/assets/audio/ui/Space_Notification1.mp3'],
      autoplay: true,
      loop: false,
      volume: 1.0,
      html5: true
    });
  }

  public playTransmitEnd() {
    const host = location.protocol + '//' + location.host;

    let sound = new Howl({
      src: ['/assets/audio/ui/Space_Notification2.mp3'],
      autoplay: true,
      loop: false,
      volume: 1.0,
      html5: true
    });
  }

}
