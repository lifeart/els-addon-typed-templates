"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug = false;
function withDebug(cb) {
    if (debug) {
        try {
            cb();
        }
        catch (e) {
            console.error(e);
        }
    }
}
exports.withDebug = withDebug;
//# sourceMappingURL=logger.js.map