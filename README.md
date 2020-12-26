# keyvals
## Parse a key/value string into an object

Zero dependencies and lightweight.

> const parse = require('keyvals').parse
> parse('foo=bar bar="multi baz"')
> { foo: "bar", bar: "multi baz"}

Quoted keys or values make it possible to include whitespace
> parse('"quoted keys" = "multi word value"')
> { "quoted keys": "multi word value"}

Mix and match quote styles
> parse(`"double"='value' 'single'="other 'value' here"`)
> { double: "value", single: "other 'value' here"}

Escape special characters or whitespace
> parse('foo="ba\"r" bar=multi\ baz')
> { foo: "ba\"r", bar: "multi baz"}

Relaxed formatting
> parse('foo  = bar bar =  "multi baz"  ')
> { foo: "bar", bar: "multi baz"}

### Testing
Fully unit tested and complete with fuzzy testing to catch any extra weird input bugs.
