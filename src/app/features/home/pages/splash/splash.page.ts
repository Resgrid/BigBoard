import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';

@Component({
  selector: 'app-home-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage implements OnInit {

  constructor(public menuCtrl: MenuController) { }

  ngOnInit() {
    
  }

  ionViewWillEnter() {
    this.menuCtrl.enable(false);
  }
}
