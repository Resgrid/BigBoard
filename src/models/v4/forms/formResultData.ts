import { type FormDataAutomationResult } from './formDataAutomationResult';

export class FormResultData {
  public Id: string = '';
  public Name: string = '';
  public Type: number = 0;
  public Data: string = '';

  public Automations: FormDataAutomationResult[] = [];
}
