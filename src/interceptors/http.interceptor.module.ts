import { Injectable, NgModule } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AlertProvider} from '../providers/alert';

@Injectable()
export class HttpsRequestInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let authToken = window.localStorage.getItem('authToken');
        const dupReq = req.clone({ headers: req.headers.set('Authorization', 'Basic ' + authToken) });
        return next.handle(dupReq);
    }
};

@Injectable()
export class EmptyResponseBodyErrorInterceptor implements HttpInterceptor {
    constructor(public alertProvider: AlertProvider) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req)
            .catch((err: HttpErrorResponse) => {
                if (err.status == 426) {
                    this.alertProvider.showOkAlert("Login Required", "Your session has expired and you need to re-login into the app from the settings view.");

                    const res = new HttpResponse({
                        body: null,
                        headers: err.headers,
                        status: err.status,
                        statusText: err.statusText,
                        url: err.url
                    });

                    return Observable.of(res);
                } else if (err.status >= 200 && err.status < 300) {
                    const res = new HttpResponse({
                        body: null,
                        headers: err.headers,
                        status: err.status,
                        statusText: err.statusText,
                        url: err.url
                    });

                    return Observable.of(res);
                } else {
                    return Observable.throw(err);
                }
            });
    }
}

@NgModule({
    providers: [
        { provide: HTTP_INTERCEPTORS, useClass: HttpsRequestInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: EmptyResponseBodyErrorInterceptor, multi: true }
    ]
})
export class HttpInterceptorModule { }