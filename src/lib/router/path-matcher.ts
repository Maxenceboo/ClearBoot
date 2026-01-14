/**
 * Match a request path against a route definition with parameter extraction.
 * Supports regex validation for route parameters (e.g., :id(\d+)).
 * 
 * @param definedPath - Route pattern defined in controller (e.g., '/users/:id(\d+)')
 * @param currentPath - Actual request path (e.g., '/users/123')
 * @returns Object containing extracted parameters, or null if no match
 * 
 * @example
 * matchPath('/users/:id(\d+)', '/users/123') // { id: '123' }
 * matchPath('/users/:id(\d+)', '/users/abc') // null (regex mismatch)
 */
export function matchPath(definedPath: string, currentPath: string): any | null {
    const defSegs = definedPath.split('/').filter(Boolean);
    const curSegs = currentPath.split('/').filter(Boolean);

    // Paths must have same segment count to match
    if (defSegs.length !== curSegs.length) return null;

    const params: any = {};

    for (let i = 0; i < defSegs.length; i++) {
        const defined = defSegs[i];
        const current = curSegs[i];

        if (defined.startsWith(':')) {
            // Regex extraction: :name(regex)
            const matches = defined.match(/^:([^\(]+)(\((.*)\))?$/);
            if (matches) {
                const name = matches[1];
                const pattern = matches[3];
                // Si une regex est présente, on la teste
                if (pattern && !new RegExp(`^${pattern}$`).test(current)) {
                    return null;
                }
                params[name] = current;
            }
        } else if (defined !== current) {
            return null;
        }
    }
    return params;
}