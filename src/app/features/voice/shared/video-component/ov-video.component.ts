import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { StreamManager, StreamPropertyChangedEvent } from 'openvidu-browser';
import { Platform } from '@ionic/angular';
declare var cordova;

@Component({
  selector: 'ov-video',
  template: `
    <video #videoElement style="width: 1px; height: 1px;">
        [attr.id]="_streamManager && _streamManager.stream ? 'video-' + _streamManager.stream.streamId : 'video-undefined'">
    </video>
  `,
})
export class OpenViduVideoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElement') elementRef: ElementRef;
  public _streamManager: StreamManager;

  rotationFunction;

  constructor(private platform: Platform) {}

  ngAfterViewInit() {
    // if (this.isIos() && this._streamManager.remote) {
    //     this.rotationFunction = () => {
    //         // Give the remote video some time to update its dimensions when rotating the device
    //         this.applyIosAttributes();
    //     };
    //     (<any>window).addEventListener('orientationchange', this.rotationFunction);
    //     this.applyIosAttributes();
    // }
    this.updateVideoView();
  }

  ngOnDestroy() {
    //if (!!this.rotationFunction) {
    //    (<any>window).removeEventListener('orientationchange', this.rotationFunction);
    //}
  }

  @Input()
  set streamManager(streamManager: StreamManager) {
    this._streamManager = streamManager;

    //const that = this;
    //setTimeout(function () {
    //   if (that._streamManager) {
    //        if (that.elementRef && that.elementRef.nativeElement) {
    //            that.elementRef.nativeElement.volume = 1;
    //        }
    //    }
    //  }, 500);
    //if (this.isIos()) {
    //    this._streamManager.on('streamPropertyChanged', event => {
    //        if ((<StreamPropertyChangedEvent>event).changedProperty === 'videoDimensions') {
    //            this.applyIosIonicVideoAttributes();
    //        }
    //   });
    // }
  }

  private updateVideoView() {
    const that = this;
    setTimeout(function () {
      if (
        that._streamManager &&
        that.elementRef &&
        that.elementRef.nativeElement
      ) {
        that._streamManager.addVideoElement(that.elementRef.nativeElement);
        that.elementRef.nativeElement.volume = 1;
      }
    }, 100);

    //this._streamManager.addVideoElement(this.elementRef.nativeElement);
    //if (this.isIos()) {
    //    (<HTMLVideoElement>this.elementRef.nativeElement).onloadedmetadata = () => {
    //        this.applyIosIonicVideoAttributes();
    //    };
    //}
  }

  private applyIosIonicVideoAttributes() {
    const ratio =
      this._streamManager.stream.videoDimensions.height /
      this._streamManager.stream.videoDimensions.width;
    this.elementRef.nativeElement.style.width = '100% !important';
    this.elementRef.nativeElement.style.objectFit = 'fill';
    const computedWidth = this.elementRef.nativeElement.offsetWidth;
    this.elementRef.nativeElement.style.height = computedWidth * ratio + 'px';
    if (!this._streamManager.remote) {
      // It is a Publisher video. Custom iosrtc plugin mirror video
      this.elementRef.nativeElement.style.transform = 'scaleX(-1)';
    }
    cordova.plugins.iosrtc.refreshVideos();
  }

  private isIos(): boolean {
    return this.platform.is('ios') && this.platform.is('cordova');
  }

  private applyIosAttributes() {
    setTimeout(() => {
      this.applyIosIonicVideoAttributes();
    }, 250);
  }
}
