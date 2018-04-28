import { TestBed, inject, async } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MockBackend } from '@angular/http/testing';
import { APP_CONFIG_TOKEN, AppConfig } from "../config/app.config-interface";
import { APP_MOCK_CONFIG } from '../config/app.config.mock';
import { AuthValidateResult } from '../models/authValidateResult';
import { AuthProvider } from './auth';

describe('Provider: Auth', () => {

    beforeEach(async(() => {

        TestBed.configureTestingModule({

            declarations: [

            ],

            providers: [
                AuthProvider,
                {
                    provide: APP_CONFIG_TOKEN,
                    useValue: APP_MOCK_CONFIG
                },
            ],

            imports: [
                HttpClientTestingModule
            ]

        }).compileComponents();

    }));

    beforeEach(() => {

    });

    it('is created', inject([AuthProvider], (authProvider: AuthProvider) => {
        expect(authProvider).toBeTruthy();
    }));

    it('should get result back from login call', inject([AuthProvider, HttpTestingController, APP_CONFIG_TOKEN], (provider: AuthProvider, httpMock: HttpTestingController, appConfig: AppConfig) => {

        provider.login("testUser", "testPassword").subscribe(result => {
            expect(result).toBeTruthy();
        });

        const mockResponse = '{"Tkn": "ekRRdGRoUWl0UjVORGhadisvcjJ5cVY5MG03M0FNNEUxVVEyNitwUExxST0=","Txd": "4/3/2019","Nme": "Test User","Eml": "test@test.com","Uid": "DB27E74B-8F00-43C7-BCE4-FD72A2C8D28B","Dcd": "12/31/1969 4:00:00 PM","Dnm": "Test Department","Did": 1}';
        const req = httpMock.expectOne(appConfig.ResgridApiUrl + '/Auth/Validate');
        expect(req.request.method).toBe("POST");
        req.flush(mockResponse);
        
    }));
});