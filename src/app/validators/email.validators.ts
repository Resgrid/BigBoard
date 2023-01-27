import { AbstractControl } from '@angular/forms';

export function emailValidator(control: AbstractControl) {

  if (control && control.value !== null && control.value !== undefined) {
    const regex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/g;
    const email = control.value as string;

    if (!email.match(regex) && email.length > 0) {
      return { invalidEmail: true };
    }
  }
  return null;
}
