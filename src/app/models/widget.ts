import { KtdGridLayoutItem } from "@katoid/angular-grid-layout";

export class Widget implements KtdGridLayoutItem  {
    public id: string = '';
    public type: number = 0; // 1: Personnel, 2: Map, 3: Weather. 4: Units, 5: Calls, 6: Log
    public name: string = "";

    public x: number = 0;
    public y: number = 0;
    public w: number = 0;
    public h: number = 0;
}