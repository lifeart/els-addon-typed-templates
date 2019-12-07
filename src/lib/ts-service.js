"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
var ts = require("typescript");
var path = require("path");
var fs = require("fs");
var utils_1 = require("./utils");
var services = {};
function serviceForRoot(uri, componentsMap) {
    if (!services[uri]) {
        var registry = ts.createDocumentRegistry(false, uri);
        var tsConfig_1 = {};
        if (fs.existsSync(path.join(uri, "tsconfig.json"))) {
            try {
                tsConfig_1 = JSON.parse(fs.readFileSync(path.join(uri, "tsconfig.json"), "utf8"));
                if (tsConfig_1 && tsConfig_1.compilerOptions) {
                    tsConfig_1 = tsConfig_1.compilerOptions;
                }
            }
            catch (e) {
                //
            }
        }
        // console.log('tsConfig', tsConfig);
        var host = {
            getCompilationSettings: function () {
                return Object.assign({}, tsConfig_1, {
                    baseUrl: ".",
                    allowJs: true,
                    allowSyntheticDefaultImports: true,
                    skipLibCheck: true,
                    moduleResolution: ts.ModuleResolutionKind.NodeJs,
                    module: ts.ModuleKind.ES2015
                });
            },
            getScriptFileNames: function () {
                var els = __spreadArrays(Object.keys(componentsMap), [
                    path.resolve(path.join(__dirname, "common-types.d.ts"))
                ]);
                var walkParams = {
                    directories: true,
                    globs: ["**/*.{js,ts,d.ts}"]
                };
                var appEntry = path.join(uri, "app");
                var addonEntry = path.join(uri, "addon");
                var typesEntry = path.join(uri, "types");
                var projectTypes = utils_1.safeWalkSync(path.join(uri, "types"), walkParams).map(function (el) { return path.resolve(path.join(typesEntry, el)); });
                var projectAppFiles = utils_1.safeWalkSync(path.join(uri, "app"), walkParams).map(function (el) { return path.resolve(path.join(appEntry, el)); });
                var projectAddonFiles = utils_1.safeWalkSync(path.join(uri, "addon"), walkParams).map(function (el) { return path.resolve(path.join(addonEntry, el)); });
                return __spreadArrays(Array.from(new Set(__spreadArrays(els, projectAppFiles, projectAddonFiles, projectTypes))));
            },
            getScriptVersion: function (_fileName) {
                if (fs.existsSync(_fileName)) {
                    var stats = fs.statSync(_fileName);
                    return stats.mtime.getTime().toString();
                }
                return "";
            },
            getScriptSnapshot: function (fileName) {
                console.log('getScriptSnapshot', fileName);
                var maybeVirtualFile = componentsMap[path.resolve(fileName)];
                if (maybeVirtualFile) {
                    return ts.ScriptSnapshot.fromString(maybeVirtualFile);
                }
                else {
                    var name_1 = path.basename(fileName, path.extname(fileName));
                    if (fs.existsSync(fileName)) {
                        return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
                    }
                    else {
                        var libName = "lib." + name_1.toLowerCase() + ".d.ts";
                        var libFileNmae = path.join(path.dirname(fileName), libName);
                        if (fs.existsSync(libFileNmae)) {
                            return ts.ScriptSnapshot.fromString(fs.readFileSync(libFileNmae).toString());
                        }
                    }
                    console.log("getScriptSnapshot:unknownFileName", fileName);
                    return ts.ScriptSnapshot.fromString("");
                }
            },
            getCurrentDirectory: function () {
                return path.resolve(uri);
            },
            getDefaultLibFileName: function (opts) {
                return path.resolve(ts.getDefaultLibFilePath(opts));
            }
        };
        services[uri] = ts.createLanguageService(host, registry);
    }
    return services[uri];
}
exports.serviceForRoot = serviceForRoot;
