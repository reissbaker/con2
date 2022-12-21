export type Expr = Call
                 | EmptyCall
                 | Dict
                 | Pair
                 | Int
                 | Float
                 | Word
                 ;

export type Program = Array<Expr> | Expr;

export abstract class AstNode {
  constructor(
    readonly line: number,
  ){}
}

export class Call extends AstNode {
  constructor(
    line: number,
    readonly fnName: string,
    readonly args: Array<Expr>,
  ) { super(line); }
}

export class EmptyCall extends AstNode {
}

export class Pair extends AstNode {
  constructor(
    line: number,
    readonly key: Expr,
    readonly value: Expr,
  ) { super(line); }
}

export class Dict extends AstNode {
  constructor(
    line: number,
    readonly pairs: Array<Pair>
  ) { super(line); }
}

export class List extends AstNode {
  constructor(
    line: number,
    readonly entries: Array<Expr>
  ) { super(line); }
}

export abstract class Value<T> extends AstNode {
  constructor(
    line: number,
    readonly value: T,
  ) { super(line); }
}

export class Int extends Value<number> {}
export class Float extends Value<number> {}
export class Word extends Value<string> {}
