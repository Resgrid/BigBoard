// Type overrides for Gluestack UI components to fix compilation issues

declare module '@gluestack-ui/modal' {
  interface InterfaceModalProps {
    children?: React.ReactNode;
  }

  interface IModalContentProps {
    children?: React.ReactNode;
  }
}

declare module '@gluestack-ui/actionsheet' {
  interface InterfaceActionsheetProps {
    children?: React.ReactNode;
    testID?: string;
  }

  interface InterfaceActionsheetContentProps {
    children?: React.ReactNode;
  }
}

declare module '@gluestack-ui/alert-dialog' {
  interface InterfaceAlertDialogProps {
    children?: React.ReactNode;
  }
}

declare module '@gluestack-ui/tooltip' {
  interface InterfaceTooltipProps {
    children?: React.ReactNode;
  }
}

// Drawer props (uses modal internally)
declare module '@/components/ui/drawer' {
  interface IDrawerProps {
    children?: React.ReactNode;
  }

  interface IDrawerContentProps {
    children?: React.ReactNode;
  }

  interface IDrawerBackdropProps {
    onPress?: () => void;
  }
}
