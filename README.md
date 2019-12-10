# els-addon-typed-templates
Ember Language Server Typed Templates Addon


How to use?

Install this addon as `dev-dependency` inside your ember project.

How typed template looks under the hood?
[issue-351282903](https://github.com/lifeart/els-addon-typed-templates/pull/11#issue-351282903)

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


## Is it stable?

* Sometimes it may crash your language server, don't worry.

