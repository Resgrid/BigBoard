import {NgGridItemConfig} from 'angular2-grid';

export class Widget  {
    public id: number = 0;
    public type: number = 0; // 1: Personnel, 2: Map, 3: Weather. 4: Units, 5: Calls, 6: Log
    public name: string = "";
    public templateString: string = "";
    public config: NgGridItemConfig;
}