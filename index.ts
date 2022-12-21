import * as fs from "fs";
import * as util from "util";
import ohm from "ohm-js";
import grammar, { ConActionDict } from "./grammar/ohm-grammar.ohm-bundle";
import * as ast from "./src/ast";

const target = process.argv[process.argv.length - 1];
const file = fs.readFileSync(target, { encoding: 'utf-8' });

function err(line: number, msg: string) {
  return new Error(`Line ${line}: ${msg}`);
}

const asAst: ConActionDict<ast.Program> = {
  Program(a) { return a.asAst },
  Expr(e) { return e.asAst },

  Call(_1, args, _2) {
    const argsAst = args.asAst;
    const line = this.source.getLineAndColumn().lineNum;
    if(argsAst.length === 0) return new ast.EmptyCall(line);
    const name = argsAst[0];
    if(!(name instanceof ast.Word)) {
      throw err(name.line ? name.line : line, "Function names must be valid identifiers");
    }
    return new ast.Call(line, name.value, argsAst.slice(1));
  },

  List(_1, args, _2) { return new ast.List(this.source.getLineAndColumn().lineNum, args.asAst); },

  Dict(a) { return a.asAst },
  EmptyDict(_1, _2) { return new ast.Dict(this.source.getLineAndColumn().lineNum, []); },
  FullDict(_1, leading, rest, _2) {
    const leadingPairs = leading.asAst;
    const restPairs = rest.asAst;
    return new ast.Dict(this.source.getLineAndColumn().lineNum, leadingPairs.concat(restPairs));
  },
  LeadingPair(key, _1, val, _2) {
    return new ast.Pair(this.source.getLineAndColumn().lineNum, key.asAst, val.asAst);
  },
  Pair(key, _, val) {
    return new ast.Pair(this.source.getLineAndColumn().lineNum, key.asAst, val.asAst);
  },

  literal(a) { return a.asAst },
  operator(_) { return new ast.Word(this.source.getLineAndColumn().lineNum, this.sourceString); },
  word(first, second) {
    return new ast.Word(
      this.source.getLineAndColumn().lineNum,
      first.sourceString + second.sourceString,
    );
  },
  number(a) { return a.asAst },
  float(_1, _2, _3) {
    return new ast.Float(this.source.getLineAndColumn().lineNum, parseFloat(this.sourceString));
  },
  int(_) {
    return new ast.Int(this.source.getLineAndColumn().lineNum, parseInt(this.sourceString, 10));
  },

  // Ohm boilerplate
  _iter(...children) {
    return children.map((child: ohm.IterationNode) => {
      return child.asAst;
    });
  },
  _nonterminal(...children) {
    if(children.length === 1) return children[0].asAst;
    else throw new Error("Internal parser error: unhandled nonterminal. Please file a bug");
  },
};

const treeBuilder = grammar.createSemantics();
treeBuilder.addAttribute('asAst', asAst);

const match = grammar.match(file);

if(!match.succeeded()) {
  console.error("Syntax error:");
  console.error(match.message);
  process.exit(1);
}

console.log("Parse succeeded!");
const tree = treeBuilder(match).asAst;
console.log(util.inspect(tree, false, null));
