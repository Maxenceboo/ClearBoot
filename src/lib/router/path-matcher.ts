export function matchPath(definedPath: string, currentPath: string): any | null {
    const defSegs = definedPath.split('/').filter(Boolean);
    const curSegs = currentPath.split('/').filter(Boolean);

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