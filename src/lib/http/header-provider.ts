import 'reflect-metadata';
import { Injectable } from '../decorators/core';
import { IHeaderProvider } from '../common/interfaces';

/**
 * Exemple de classe injectable pour gérer les headers de réponse
 * Peut être utilisée avec le décorateur @Header(ApiHeaderProvider)
 */
@Injectable()
export class ApiHeaderProvider implements IHeaderProvider {
    private version: string = '2.0';

    getHeaders(): Record<string, string> {
        return {
            'X-API-Version': this.version,
            'X-Powered-By': 'ClearBoot',
        };
    }

    setVersion(version: string) {
        this.version = version;
    }
}
