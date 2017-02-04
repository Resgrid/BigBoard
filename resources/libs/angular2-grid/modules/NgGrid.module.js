import { NgModule } from '@angular/core';
import { NgGrid, NgGridItem, NgGridPlaceholder } from '../main';
export var NgGridModule = (function () {
    function NgGridModule() {
    }
    NgGridModule.decorators = [
        { type: NgModule, args: [{
                    declarations: [NgGrid, NgGridItem, NgGridPlaceholder],
                    entryComponents: [NgGridPlaceholder],
                    exports: [NgGrid, NgGridItem]
                },] },
    ];
    /** @nocollapse */
    NgGridModule.ctorParameters = function () { return []; };
    return NgGridModule;
}());
//# sourceMappingURL=NgGrid.module.js.map