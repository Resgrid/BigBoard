import * as TypeMoq from "typemoq";
import { BigBoardApp } from './app.component';
import { Nav, Platform } from 'ionic-angular';
import { HttpInterceptorService } from 'ng-http-interceptor';
import { SettingsProvider } from '../providers/settings';
import { TranslateService } from "ng2-translate";
import { HomePage } from '../pages/home/home';

let instance: BigBoardApp = null;

describe('BigBoardApp', () => {

    beforeEach(() => {
        let platformMock: TypeMoq.IMock<Platform> = TypeMoq.Mock.ofType(Platform);
        let httpInterceptorServiceMock: TypeMoq.IMock<HttpInterceptorService> = TypeMoq.Mock.ofType(HttpInterceptorService);
        let settingsProviderMock: TypeMoq.IMock<SettingsProvider> = TypeMoq.Mock.ofType(SettingsProvider);
        let translateServiceMock: TypeMoq.IMock<TranslateService> = TypeMoq.Mock.ofType(TranslateService);
        let navMock: TypeMoq.IMock<Nav> = TypeMoq.Mock.ofType(Nav);

        instance = new BigBoardApp(platformMock.object, httpInterceptorServiceMock.object, settingsProviderMock.object, translateServiceMock.object);
        instance['nav'] = navMock.object;
    });

    it('initialises with two possible pages', () => {
        expect(instance['pages'].length).toEqual(2);
    });

    it('initialises with a root page', () => {
        expect(instance['rootPage']).not.toBe(null);
    });

    it('initialises with a root page of HomePage', () => {
        expect(instance['rootPage']).toBe(HomePage);
    });

    it('opens a page', () => {
        spyOn(instance['menu'], 'close');
        spyOn(instance['nav'], 'setRoot');
        instance.openPage(instance['pages'][1]);
        expect(instance['menu']['close']).toHaveBeenCalled();
        expect(instance['nav'].setRoot).toHaveBeenCalledWith(HomePage);
    });
});