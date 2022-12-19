abstract class AstNode {
  constructor(readonly line: number) {}
  abstract toJson(): { type: string };
}

export class Int extends AstNode {
  constructor(
    line: number,
    readonly tokens: string,
  ) { super(line); }
  value() {
    return parseInt(this.tokens, 10);
  }
  toJson() {
    return {
      type: "Int",
      value: this.value(),
    };
  }
}

export class Float extends AstNode {
  constructor(
    line: number,
    readonly tokens: string,
  ) { super(line); }

  value() {
    return parseFloat(this.tokens);
  }
  toJson() {
    return {
      type: "Float",
      value: this.value(),
    };
  }
}

export class Operator extends AstNode {
  constructor(
    line: number,
    readonly tokens: string,
  ) { super(line); }
  toJson() {
    return {
      type: "Operator",
      value: this.tokens,
    };
  }
}

export class Call extends AstNode {
  constructor(
    line: number,
    readonly name: Term,
    readonly args: ExpandedNodes[],
  ) { super(line); }
  toJson(): { type: string } & any {
    return {
      type: 'Call',
      name: this.name.toJson(),
      args: this.args.map(arg => arg.toJson()),
    };
  }
}

export class Term extends AstNode {
  constructor(
    line: number,
    readonly tokens: string,
  ) { super(line); }
  toJson() {
    return {
      type: 'Term',
      value: this.tokens,
    };
  }
}

export class Arg extends AstNode {
  constructor(
    line: number,
    readonly term: Term,
    readonly termType: Term,
  ) { super(line) }

  toJson() {
    return {
      type: 'Arg',
      term: this.term.toJson(),
      termType: this.termType.toJson(),
    }
  }
}

export class ArgList extends AstNode {
  constructor(
    line: number,
    readonly args: Arg[],
  ) { super(line) }
  toJson() {
    return {
      type: 'ArgList',
      args: this.args.map(arg => arg.toJson()),
    };
  }
}

export class Def extends AstNode {
  constructor(
    line: number,
    readonly name: Term,
    readonly args: ArgList,
    readonly body: ExpandedNodes[],
  ) { super(line); }
  toJson(): { type: string } & any {
    return {
      type: 'Def',
      name: this.name.toJson(),
      args: this.args.toJson(),
      body: this.body.map(node => node.toJson()),
    };
  }
}

export type ParserNodes = Int
                        | Float
                        | Operator
                        | Call
                        | Term
                        | Arg
                        | ArgList
                        ;

export type ExpandedNodes = ParserNodes
                          | Def
                          ;

type WalkArgs<R> = {
  int(i: Int): R,
  float(f: Float): R,
  op(o: Operator): R,
  call(c: Call): R,
  term(t: Term): R,
  def(d: Def): R,
  arg(a: Arg): R,
  argList(a: ArgList): R,
};

export function replace(
  nodes: ExpandedNodes[], walk: Partial<WalkArgs<ExpandedNodes>>
): ExpandedNodes[] {
  function safeReplace<T>(fn: ((t: T) => ExpandedNodes) | undefined, r: T) {
    if(fn) return fn(r);
    return r;
  }
  return nodes.map(node => {
    if(node instanceof Int) return safeReplace(walk.int, node);
    if(node instanceof Float) return safeReplace(walk.float, node);
    if(node instanceof Operator) return safeReplace(walk.op, node);
    if(node instanceof Call) {
      const replacedArgs = replace(node.args, walk);
      return safeReplace(walk.call, new Call(
        node.line,
        node.name,
        replacedArgs
      ));
    }
    if(node instanceof Term) return safeReplace(walk.term, node);

    if(node instanceof Def) {
      const replacedArgs = safeReplace(walk.argList, node.args);
      if(!(replacedArgs instanceof ArgList)) {
        throw new Error("Attempted to replace an arg list with a non-arg-list");
      }
      const replacedBody = replace(node.body, walk);
      return safeReplace(walk.def, new Def(
        node.line,
        node.name,
        replacedArgs,
        replacedBody
      ));
    }

    if(node instanceof Arg) return safeReplace(walk.arg, node);

    const replacedArgs = replace(node.args, walk);
    const checkedArgs = replacedArgs.map(arg => {
      if(arg instanceof Arg) return arg;
      throw new Error("Attempted to replace an arg in a list with a non-arg");
    });
    return safeReplace(walk.argList, new ArgList(
      node.line,
      checkedArgs
    ));
  });
}

