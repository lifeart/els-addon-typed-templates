# els-addon-typed-templates
Ember Language Server Typed Templates Addon

How to use?

Install this addon as `dev-dependency` inside your ember project.

How typed template looks under the hood?
[issue-351282903](https://github.com/lifeart/els-addon-typed-templates/pull/11#issue-351282903)

* route templates not supported (yet);

### Autocomplete

![autocomplete preview](previews/autocomplete.png)

### Warn Each


![warn each](previews/warn-each.png)

### Unknown Property
![warn unknown](previews/warn-unknown.png)

### Features

* Component context autocomplete `{{this.}}`
* Component arguments autocomplete `{{@}}`
* Warn on undefined properties (on complete)
* Warn on incorrect `each` arguments (not an array)

### NPM
`npm install els-addon-typed-templates --save-dev`

### Yarn
`yarn add els-addon-typed-templates --dev`

### VSCode

Install: [Unstable Ember Language Server](https://marketplace.visualstudio.com/items?itemName=lifeart.vscode-ember-unstable).

* Restart `VSCode`.


## Usage


Try type `{{this.}}` or `{{@}}` inside component template.

[UELS](https://marketplace.visualstudio.com/items?itemName=lifeart.vscode-ember-unstable) >= `0.2.57` required.


### Ignore line?

 - use handlebars comments

```hbs
 {{!-- @ts-ignore --}} 
 {{this.line.to.ignore}}
```

### Ignore file?

```hbs
{{!-- @ts-nocheck --}}
```


QA:

	- Looks like it's not working.


	- To get it woking you have to: 

		1.) try autocomplete component (to collect registry) 
		2.) try autcomplete path `this.` or `@..`
		3.) change document content
		
	There is some issue (not really), addons don't have initializers (yet), and it start working once you explicitly invoke it.
	
	You get validation for onDocumentChange method. But, before it, you have to have registry for all ember-app items (and that's why you need autocomplete some component first), get registry, register validator on path autocomplete, start validation on any change (whis is how it's initialized)

	You have to do it once (per project start in vscode) and other document changes should be validated.

QA:
 
	- Would it be possible to add these as dependencies to the language server or somesuch?
	- Nope, because it's "experimental" and "heavy" functionality, adding it into language server itself may decrease DX for other users. UELS has addon API, using this addon API you able add functionality into langserver. All addons scoped inside projects (to allow users have multple addon versions for different ember projects and versions).

## Is it stable?

* Sometimes it may crash your language server, don't worry.

