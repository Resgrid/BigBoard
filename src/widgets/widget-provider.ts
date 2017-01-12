import { Injectable } from '@angular/core';

@Injectable()
export class WidgetProvider {

  constructor() {}

  public getWidgetTemplate(type: number): string {
    switch (type) 
    { 
        case 1: // Personnel
            return this.getPersonnelWidgetTemplate();
        case 2: // Map
            return this.getMapWidgetTemplate();
        case 3: // Weather
            return this.getWeatherWidgetTemplate(); 
        case 4: // Units
            return this.getUnitsWidgetTemplate(); 
        case 5: // Calls
            return this.getCallWidgetTemplate();
        case 6: // Logs
            return this.getLogsWidgetTemplate();
        default: 
            return ""
    } 
  }

  public getPersonnelWidgetTemplate(): string {
      return "";
  }

  public getMapWidgetTemplate(): string {
      return "";
  }

  public getWeatherWidgetTemplate(): string {
      return "";
  }

  public getUnitsWidgetTemplate(): string {
      return "";
  }

  public getCallWidgetTemplate(): string {
  /*    return `<div class="table-responsive">
                    <table id="callsFullTable" class='table table-striped table-condensed'>
                        <thead>
                        <tr>
                            <th ng-show="widgetSettings.showId">Id</th>
                            <th ng-show="widgetSettings.showName">Call Name</th>
                            <th ng-show="widgetSettings.showTimestamp">Logged Timestamp</th>
                            <th ng-show="widgetSettings.showUser">Logging User</th>
                            <th ng-show="widgetSettings.showPriority">Priority</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr ng-repeat="call in calls">
                            <td ng-show="widgetSettings.showId">{{call.Id}}</td>
                            <td ng-show="widgetSettings.showName">{{call.Name}}</td>
                            <td ng-show="widgetSettings.showTimestamp">{{call.Timestamp | fromNow}}</td>
                            <td ng-show="widgetSettings.showUser">{{call.LoggingUser}}</td>
                            <td ng-show="widgetSettings.showPriority" class="{{call.PriorityCss}}">{{call.Priority}}</td>
                        </tr>
                        </tbody>
                    </table>
                </div>`;
    */
    return '<calls-widget></calls-widget>';
  }

  public getLogsWidgetTemplate(): string {
      return "";
  }
}