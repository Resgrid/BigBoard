// Temporary type patches for gluestack-ui modules that have incorrect type definitions

declare module '@gluestack-ui/actionsheet' {
  export function createActionsheet(config: any): any;
}

declare module '@gluestack-ui/alert-dialog' {
  export function createAlertDialog(config: any): any;
}

declare module '@gluestack-ui/modal' {
  export function createModal(config: any): any;
}

declare module '@gluestack-ui/tooltip' {
  export function createTooltip(config: any): any;
}
