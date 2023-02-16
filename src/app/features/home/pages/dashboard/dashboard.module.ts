import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardPage } from './dashboard.page';
import { NgxResgridLibModule } from '@resgrid/ngx-resgridlib';
import { TranslateModule } from '@ngx-translate/core';
import { KtdGridModule } from '@katoid/angular-grid-layout';
import { WidgetsModule } from 'src/app/features/widgets/widgets.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: DashboardPage
      }
    ]),
    NgxResgridLibModule,
    TranslateModule,
    KtdGridModule,
    WidgetsModule
  ],
  declarations: [DashboardPage]
})
export class DashboardPageModule {}
