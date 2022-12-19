import * as fs from "fs";
import * as util from "util";
import { Parser } from "./src/parser";
import { replace, ArgList, Def, Term } from "./src/ast";

const target = process.argv[process.argv.length - 1];
const file = fs.readFileSync(target, { encoding: 'utf-8' });
const parser = new Parser(file);
const parsed = parser.parse();

console.log("Initial parse:");
console.log("====================================================================================");
console.log(util.inspect(parsed.map(ast => ast.toJson()), false, null));

const expanded = replace(parsed, {
  call(c) {
    if(c.name.tokens !== "def") return c;
    const name = c.args[0];
    if(!(name instanceof Term)) throw new Error(`Line ${name.line}: Expected a valid name`);
    const args = c.args[1];
    if(!(args instanceof ArgList)) {
      throw new Error(
        `Line ${args.line}: Expected an argument list; got \`${util.inspect(args.toJson())}\``
      );
    }
    return new Def(
      c.line,
      name,
      args,
      c.args.slice(2)
    );
  }
});

console.log("\nPost-expansion:");
console.log("====================================================================================");
console.log(util.inspect(expanded.map(ast => ast.toJson()), false, null));
