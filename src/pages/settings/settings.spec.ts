import * as TypeMoq from "typemoq";
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { App, Config, Form, IonicModule, Keyboard, DomController, MenuController, NavController, Platform, LoadingController, AlertController } from 'ionic-angular';
import { ConfigMock, PlatformMock, LoadingControllerMock, AlertControllerMock } from '../../mocks';
import { APP_CONFIG_TOKEN } from "../../config/app.config-interface";
import { APP_DEV_CONFIG } from "../../config/app.config.dev";
import { SettingsPage }      from './settings';
import { SettingsProvider } from '../../providers/settings';
import { SettingsProviderMock } from '../../providers/settings.mock';
import { AuthProvider } from '../../providers/auth';
import { AuthProviderMock } from '../../providers/auth.mock';
import { Consts } from '../../app/consts';

let fixture: ComponentFixture<SettingsPage> = null;
let instance: any = null;

describe('Pages: SettingsPage', () => {

  // demonstration on how to manually compile the test bed (as opposed to calling TestUtils)
  beforeEach(async(() => {

    TestBed.configureTestingModule({
      declarations: [SettingsPage],
      providers: [App, DomController, Form, Keyboard, MenuController, NavController,
        {provide: Config, useClass: ConfigMock}, {provide: Platform, useClass: PlatformMock}, Consts,
        {provide: SettingsProvider, useClass: SettingsProviderMock}, {provide: AuthProvider, useClass: AuthProviderMock},
        {provide: AuthProvider, useClass: AuthProviderMock}, {provide: LoadingController, useClass: LoadingControllerMock},
        {provide: AlertController, useClass: AlertControllerMock}, { provide: APP_CONFIG_TOKEN, useFactory: APP_DEV_CONFIG }
      ],
      imports: [
        FormsModule,
        IonicModule,
        ReactiveFormsModule,
      ],
    })
    .compileComponents().then(() => {
      fixture = TestBed.createComponent(SettingsPage);
      instance = fixture;
      fixture.detectChanges();
    });
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create settings page', () => {
    expect(fixture).toBeTruthy();
    expect(instance).toBeTruthy();
  });
});