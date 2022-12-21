Use Babel to generate JS. Convert your AST representation to theirs, and then
just call generate.

Pretty sure Babel can parse .d.ts files... Can you use this to automatically
provide typing for TS libraries for Con? I mean, that might be insane, TS is
Turing-complete and you can write a SQL query as a type...

Would be nice to have a Con subset that allows only literals and only allows
types that resolve to literals; the JSON of Con. JCon? lmao. Or Sleight?
Anyway: you can typecheck it with Con, and you can send it across the network
to whatever, or even convert it to JSON. Maybe this is just structural/zod for
Con actually, but built in. And .jcon files can be imported and type-checked,
and the subset will be enforced. Okay: Jcon is the language subset; then you
can convert to JSON, or convert from JSON via structural-like.
