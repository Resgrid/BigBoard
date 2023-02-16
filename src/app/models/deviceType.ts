export interface IDevice {
	label: string;
	device: string;
	type?: CameraType | null;
}

export enum CameraType {
	FRONT = 'FRONT',
	BACK = 'BACK'
}
