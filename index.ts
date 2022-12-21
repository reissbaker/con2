import * as fs from "fs";
import * as util from "util";
import ohm from "ohm-js";
import grammar, { ConActionDict } from "./grammar/ohm-grammar.ohm-bundle";

const target = process.argv[process.argv.length - 1];
const file = fs.readFileSync(target, { encoding: 'utf-8' });

type LispAst = Array<LispAst>
             | number
             | { [key: string]: LispAst }
             | string
             ;

const asLisp: ConActionDict<LispAst> = {
  Program(a) { return a.asLisp },
  Expr(e) { return e.asLisp },
  Call(_1, args, _2) { return [ args.asLisp ] },
  List(_1, args, _2) { return [ args.asLisp ] },
  Dict(a) { return a.asLisp },
  EmptyDict(_1, _2) { return {} },
  FullDict(_1, leading, rest, _2) {
    const leadingPairs = leading.asLisp;
    const restPairs = rest.asLisp;
    return Object.fromEntries([ leadingPairs.concat(restPairs) ]);
  },

  LeadingPair(key, _1, val, _2) { return [key.asLisp, val.asLisp]; },
  Pair(key, _, val) { return [key.asLisp, val.asLisp]; },

  literal(a) { return a.asLisp },
  operator(_) { return this.sourceString },
  word(first, second) { return first.sourceString + second.sourceString },
  number(a) { return a.asLisp },
  float(_1, _2, _3) {
    return parseFloat(this.sourceString);
  },
  int(_) { return parseInt(this.sourceString, 10); },

  _iter(...children) {
    return children.map((child: ohm.IterationNode) => {
      return child.asLisp;
    });
  },
  _nonterminal(...children) {
    if(children.length === 1) return children[0].asLisp;
    else throw new Error("Internal parser error: unhandled nonterminal. Please file a bug");
  },
};

const treeBuilder = grammar.createSemantics();
treeBuilder.addAttribute('asLisp', asLisp);

const match = grammar.match(file);

if(!match.succeeded()) {
  console.error("Syntax error:");
  console.error(match.message);
  process.exit(1);
}

console.log("Parse succeeded!");
const tree = treeBuilder(match).asLisp;
console.log(util.inspect(tree, false, null));
