/**
 * Type declarations to handle Gluestack UI v2 compatibility issues
 * These declarations resolve type mismatches between packages
 */

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

declare module '@gluestack-ui/modal' {
  interface IModalProps {
    children?: React.ReactNode;
  }
}

declare module '@gluestack-ui/drawer' {
  interface IDrawerProps {
    children?: React.ReactNode;
  }
}

declare module '@gluestack-ui/actionsheet' {
  interface IActionsheetProps {
    children?: React.ReactNode;
  }
}

declare module '@gluestack-ui/alert-dialog' {
  interface IAlertDialogProps {
    children?: React.ReactNode;
  }
}

declare module '@gluestack-ui/tooltip' {
  interface ITooltipProps {
    children?: React.ReactNode;
  }
}

declare module 'tailwind-variants/dist/config' {
  export interface TVConfig {
    [key: string]: any;
  }
}

// Global type augmentations for Motion components compatibility
declare global {
  namespace React {
    interface HTMLAttributes<T> {
      className?: string;
      pointerEvents?: string;
    }
  }
}
