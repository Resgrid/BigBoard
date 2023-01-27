import { AbstractControl } from '@angular/forms';

export function urlValidator(control: AbstractControl) {
  if (control && control.value !== null && control.value !== undefined) {
    let validUrl = true;

    try {
      new URL(control.value);
    } catch {
      validUrl = false;
    }
    if (!validUrl) {
      return {
        invalidUrl: true,
        message: 'Value does not appear to be a valid url.',
      };
    }

    return true;
  }

  return null;
}
