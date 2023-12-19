import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { reducer } from './reducers/settings.reducer';
import { SettingsRoutingModule } from './settings-routing.module';
import { EffectsModule } from '@ngrx/effects';
import { SettingsEffects } from './effects/settings.effects';
import { StoreModule } from '@ngrx/store';
import { ModalLoginPage } from './modals/login/modal-login.page';
import { ModalServerInfoPage } from './modals/serverInfo/modal-serverInfo.page';
import { ModalConfirmLogoutPage } from './modals/confirmLogout/modal-confirmLogout.page';
import { ModalAboutPage } from './modals/about/modal-about.page';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    StoreModule.forFeature('settingsModule', reducer),
    EffectsModule.forFeature([SettingsEffects]),
    SettingsRoutingModule,
    TranslateModule,
  ],
  declarations: [
    ModalLoginPage,
    ModalServerInfoPage,
    ModalConfirmLogoutPage,
    ModalAboutPage,
  ],
  exports: [],
})
export class SettingsModule {}
