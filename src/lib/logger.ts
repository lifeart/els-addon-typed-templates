const debug = false;

export function withDebug(cb) {
    if (debug) {
        try {
            cb();
        } catch(e) {
            console.error(e);
        }
    }
}