import { AbstractControl } from '@angular/forms';

export function passwordValidator(control: AbstractControl) {

  if (control && control.value !== null && control.value !== undefined) {
    const value = control.value as string;
    if (value.length < 6) {
      return {
        invalidPassword: true,
        message: 'Password must be at least 6 characters long',
      };
    }
  }
  return null;
}
