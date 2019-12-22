
declare module "ember-typed-templates" {
    interface GlobalRegistry {
        fns: (a, b, c)=>any;
        onx: (naem: string) => undefined;
        boo: (name?, hash?) => [ {a:1} ]
    }
}
