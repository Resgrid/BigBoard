import { Injectable } from "@angular/core";
import { Platform } from "@ionic/angular";
import { StorageService } from "@resgrid/ngx-resgridlib";
import { Device, OpenVidu } from "openvidu-browser";
import { CameraType, IDevice } from "../models/deviceType";

declare var cordova:any;


@Injectable({
  providedIn: "root",
})
export class OpenViduDevicesService {
  private OV: OpenVidu | null = null;
  private devices: Device[];
  private cameras: IDevice[] = [];
  private microphones: IDevice[] = [];
  private camSelected: IDevice | undefined;
  private micSelected: IDevice | undefined;
  private videoDevicesDisabled: boolean;
  private audioDevicesDisabled: boolean;

  constructor(private storageSrv: StorageService, private platform: Platform) {
    this.OV = new OpenVidu();
  }

  public async initDevices(): Promise<void> {
    await this.initOpenViduDevices();
    this.devices.length > 0 ? console.log("Devices found: ", this.devices) : console.log("No devices found!");
    this.resetDevicesArray();
    if (this.hasAudioDeviceAvailable()) {
      this.initAudioDevices();
      this.micSelected = this.getMicSelected();
    }
    if (this.hasVideoDeviceAvailable()) {
      this.initVideoDevices();
      this.camSelected = this.cameras.find((device) => device.type === CameraType.FRONT);
    }
  }
  private async initOpenViduDevices() {
    this.devices = await this.OV!.getDevices();

    //if (this.platform.is('ios')) {
    //  if (cordova && cordova.plugins && cordova.plugins.iosrtc) {
    //    let mediaDevicesObj = new cordova.plugins.iosrtc.MediaDevices();
    //    let mediaDevices = mediaDevicesObj.enumerateDevices();
    //  }
    //}
  }

  private initAudioDevices() {
    const audioDevices = this.devices.filter((device) => device.kind === "audioinput");
    audioDevices.forEach((device: Device) => {
      this.microphones.push({ label: device.label, device: device.deviceId });
    });
  }

  private initVideoDevices() {
    const FIRST_POSITION = 0;
    const videoDevices = this.devices.filter((device) => device.kind === "videoinput");
    videoDevices.forEach((device: Device, index: number) => {
      const myDevice: IDevice = {
        label: device.label,
        device: device.deviceId,
        type: CameraType.BACK,
      };
      // We assume first device is web camera in Browser Desktop
      if (index === FIRST_POSITION) {
        myDevice.type = CameraType.FRONT;
      }

      this.cameras.push(myDevice);
    });
    console.log("Camera selected", this.camSelected);
  }

  getCamSelected(): IDevice | undefined {
    if (this.cameras.length === 0) {
      console.log("No video devices found!");
      return undefined;
    }
    const storageDevice = this.getCamFromStorage();
    if (storageDevice) {
      return storageDevice;
    }
    return this.camSelected || this.cameras[0];
  }

  private getCamFromStorage() {
    let storageDevice = this.storageSrv.read('openviduCallVideoDevice');
    storageDevice = this.getCameraByDeviceField(storageDevice?.device);
    if (storageDevice) {
      return storageDevice;
    }
  }

  getMicSelected(): IDevice | undefined {
    if (this.microphones.length === 0) {
      console.log("No audio devices found!");
      return undefined;
    }
    //const storageDevice = this.getMicFromStogare();
    //if (storageDevice) {
    //  return storageDevice;
    //}
    return this.micSelected || this.microphones[0];
  }

  private getMicFromStogare(): IDevice | null {
    let storageDeviceId = this.storageSrv.read('openviduCallAudioDevice');

    if (storageDeviceId) {
      let storageDevice = this.getMicrophoneByDeviceField(storageDeviceId);
      if (storageDevice) {
        return storageDevice;
      }
    }

    return null;
  }

  setCamSelected(deviceField: any) {
    this.camSelected = this.getCameraByDeviceField(deviceField);
  }

  setMicSelected(deviceField: any) {
    this.micSelected = this.getMicrophoneByDeviceField(deviceField);
  }

  needUpdateVideoTrack(newVideoSource: string): boolean {
    return this.getCamSelected()?.device !== newVideoSource;
  }

  needUpdateAudioTrack(newAudioSource: string): boolean {
    return this.getMicSelected()?.device !== newAudioSource;
  }

  getCameras(): IDevice[] {
    return this.cameras;
  }

  getMicrophones(): IDevice[] {
    return this.microphones;
  }

  hasVideoDeviceAvailable(): boolean {
    return !this.videoDevicesDisabled && !!this.devices?.find((device) => device.kind === "videoinput");
  }

  hasAudioDeviceAvailable(): boolean {
    return !this.audioDevicesDisabled && !!this.devices?.find((device) => device.kind === "audioinput");
  }

  cameraNeedsMirror(deviceField: string): boolean {
    return this.getCameraByDeviceField(deviceField)?.type === CameraType.FRONT;
  }

  areEmptyLabels(): boolean {
    return !!this.cameras.find((device) => device.label === "") || !!this.microphones.find((device) => device.label === "");
  }

  disableVideoDevices() {
    this.videoDevicesDisabled = true;
  }

  disableAudioDevices() {
    this.audioDevicesDisabled = true;
  }

  clear() {
    this.OV = new OpenVidu();
    this.devices = [];
    this.cameras = [];
    this.microphones = [];
    this.camSelected = undefined;
    this.micSelected = undefined;
    this.videoDevicesDisabled = false;
    this.audioDevicesDisabled = false;
  }

  private getCameraByDeviceField(deviceField: any): IDevice | undefined {
    return this.cameras.find((opt: IDevice) => opt.device === deviceField || opt.label === deviceField);
  }

  private getMicrophoneByDeviceField(deviceField: any): IDevice | undefined {
    return this.microphones.find((opt: IDevice) => opt.device === deviceField || opt.label === deviceField);
  }

  private resetDevicesArray() {
    this.cameras = [{ label: "Default", device: "", type: null }];
    this.microphones = [{ label: "Default", device: "", type: null }];
  }
}
