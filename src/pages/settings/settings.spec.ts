import {} from 'jasmine';
import { ComponentFixture, async }    from '@angular/core/testing';
import { TestUtils }                  from '../../test';
import { SettingsPage }                from './settings';

let fixture: ComponentFixture<SettingsPage> = null;
let instance: SettingsPage = null;

describe('Page: Settings Page', () => {

  beforeEach(async(() => TestUtils.beforeEachCompiler([SettingsPage]).then(compiled => {
    fixture = compiled.fixture;
    instance = compiled.instance;
    fixture.detectChanges();
  })));

  afterEach(() => {
    fixture.destroy();
  });

  it('initialises', () => {
    expect(instance).toBeTruthy();
  });

  it('isDemo', () => {
    expect(instance.demoMode).toBeFalsy();
  });
});