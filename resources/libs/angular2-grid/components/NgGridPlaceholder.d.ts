import { NgGrid } from '../directives/NgGrid';
import { NgGridItemPosition, NgGridItemSize } from '../interfaces/INgGrid';
import { ElementRef, Renderer, OnInit } from '@angular/core';
export declare class NgGridPlaceholder implements OnInit {
    private _ngEl;
    private _renderer;
    private _size;
    private _position;
    private _ngGrid;
    private _cascadeMode;
    constructor(_ngEl: ElementRef, _renderer: Renderer);
    registerGrid(ngGrid: NgGrid): void;
    ngOnInit(): void;
    setSize(newSize: NgGridItemSize): void;
    setGridPosition(newPosition: NgGridItemPosition): void;
    setCascadeMode(cascade: string): void;
    private _setDimensions(w, h);
    private _setPosition(x, y);
    private _recalculatePosition();
    private _recalculateDimensions();
}
