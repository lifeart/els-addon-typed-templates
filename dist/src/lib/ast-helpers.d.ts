export declare function isParamPath(astPath: any): any;
export declare function relplaceFocusPathForExternalComponentArgument(focusPath: any): any;
export declare function isExternalComponentArgument(focusPath: any): boolean;
export declare function realPathName(focusPath: any): any;
export declare function isArgumentName(textPath: any): any;
export declare function normalizeArgumentName(textPath: any): any;
export declare function serializeArgumentName(textPath: any): any;
export declare function canHandle(type: string, focusPath: any): boolean;
export declare function isEachArgument(focusPath: any): true | undefined;
export declare function isSimpleBlockComponentElement(node: any): boolean;
export declare function positionForItem(item: any): string;
export declare function keyForItem(item: any): string;
export declare function tagComponentToBlock(node: any): {
    type: string;
    isComponent: boolean;
    path: {
        type: string;
        original: string;
        this: boolean;
        data: boolean;
        parts: string[];
        loc: any;
    };
    params: never[];
    inverse: null;
    hash: {
        type: string;
        pairs: any;
    };
    program: {
        type: string;
        body: any;
        blockParams: any;
        chained: boolean;
        loc: any;
    };
    loc: any;
};
//# sourceMappingURL=ast-helpers.d.ts.map