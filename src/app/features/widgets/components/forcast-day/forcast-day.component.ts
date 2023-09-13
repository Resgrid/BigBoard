import { Component, OnInit, Input } from '@angular/core';
import {
  CallPriorityResultData,
  CallResultData,
  UtilsService,
} from '@resgrid/ngx-resgridlib';
import { Daily } from '../../models/weather';

@Component({
  selector: 'app-widgets-forcast-day',
  templateUrl: './forcast-day.component.html',
  styleUrls: ['./forcast-day.component.scss'],
})
export class ForcastDayComponent implements OnInit {
  @Input() day: Daily;

  constructor(private utilsProvider: UtilsService) {}

  ngOnInit() {}

  public getDay(dt: number): string {
    return this.utilsProvider.formatDateString(new Date(dt));
  }
}
