import { Arg, ArgList, Int, Float, Operator, Call, Term, ParserNodes } from "./ast";

const A = "A".charCodeAt(0);
const Z = "Z".charCodeAt(0);
const a = "a".charCodeAt(0);
const z = "z".charCodeAt(0);
const ZERO = '0'.charCodeAt(0);
const NINE = '9'.charCodeAt(0);

export class Parser {
  private index = 0;
  private line = 0;

  constructor(readonly file: string) {}

  parse() {
    return this.parseFrom(0, this.file.length - 1);
  }

  private parseFrom(start: number, end: number): ParserNodes[] {
    const nodes: ParserNodes[] = [];

    for(this.index = start; this.index <= end; this.index++) {
      const char = this.file[this.index];
      console.log("PARSING FROM INDEX", this.index, char);

      switch(char) {
        case ' ':
          break;
        case '\n':
          this.line++;
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          nodes.push(this.parseNumber());
          break;
        case '(':
          nodes.push(this.parseCall());
          console.log("DONE PARSING CALL", this.index);
          break;
        case ')':
          this.err('Unexpected )');
          break;
        case '[':
          nodes.push(this.parseArgList());
          break;
        case ']':
          this.err('Unexpected ]');
          break;
        default:
          nodes.push(this.parseOpOrTerm());
      }
      console.log(nodes);
    }

    return nodes;
  }

  private validOperator(char: string) {
    switch(char) {
      case '+':
      case '-':
      case '/':
      case '*':
      case '%':
        return true;
    }
    return false;
  }

  private whileValid(
    valid: (char: string) => boolean, callback: (char: string) => any
  ) {
    this.eatWhitespace();

    const start = this.index;
    for(
      let current = this.file[this.index];
      valid(current);
      current = this.file[++this.index]
    ) {
      switch(current) {
        case ' ':
          break;
        case '\n':
          this.line++;
          break;
        default:
          callback(current);
          break;
      }
    }

    if(start < this.index) this.index--;
  }

  private parseOpOrTerm(): Term | Operator {
    this.eatWhitespace();
    if(this.validOperator(this.file[this.index])) {
      this.index++;
      return new Operator(this.line, this.file[this.index - 1]);
    }

    return this.parseTerm();
  }

  private eatWhitespace() {
    while(this.file[this.index] === ' ' || this.file[this.index] === '\n') {
      if(this.file[this.index] === '\n') this.line++;
      this.index++;
    }
  }

  private parseArg(): Arg {
    const tokens: string[] = [];
    let isFirst = true;
    this.whileValid(
      char => this.validIdChar(char, isFirst) || char === ":",
      char => {
        tokens.push(char);
        isFirst = false;
      }
    );
    if(tokens.length === 0) this.err(`Unexpected \`${this.file[this.index]}\``);
    const split = tokens.join('').split(":");
    if(split.length !== 2) this.err(`Too many colon (:) characters`);
    return new Arg(
      this.line,
      new Term(this.line, split[0]),
      new Term(this.line, split[1])
    );
  }

  private parseArgList(): ArgList {
    let endParen = -1;
    let parenCount = 0;
    const line = this.line;

    for(let index = this.index; index < this.file.length; index++) {
      const char = this.file[index];
      switch(char) {
        case '[':
          parenCount++;
          break;
        case ']':
          parenCount--;
          break;
      }
      if(parenCount === 0) {
        endParen = index;
        break
      }
    }
    if(endParen < 0) this.err("Unmatched square brackets");
    this.index++;

    const args = [];
    this.eatWhitespace();
    while(this.index !== endParen) {
      console.log(this.index, this.file[this.index]);
      args.push(this.parseArg());
      this.index++;
      this.eatWhitespace();
    }
    this.index++;
    return new ArgList(line, args);
  }

  private parseTerm(): Term {
    const name: string[] = [];
    let isFirst = true;

    this.whileValid(
      char => this.validIdChar(char, isFirst),
      char => {
        name.push(char);
        isFirst = false;
      }
    );
    if(name.length === 0) this.err(`Unexpected \`${this.file[this.index]}\``);

    return new Term(this.line, name.join(''));
  }

  private validIdChar(char: string, isInitial: boolean): boolean {
    const charCode = char.charCodeAt(0);
    if(charCode >= A && charCode <= Z) return true;
    if(charCode >= a && charCode <= z) return true;
    if(!isInitial && char === '_') return true;
    if(!isInitial && charCode >= ZERO && charCode <= NINE) return true;
    return false;
  }

  private parseCall(): Call {
    let endParen = -1;
    let parenCount = 0;
    const line = this.line;

    for(let index = this.index; index < this.file.length; index++) {
      const char = this.file[index];
      switch(char) {
        case '(':
          parenCount++;
          break;
        case ')':
          parenCount--;
          break;
      }
      if(parenCount === 0) {
        endParen = index;
        break
      }
    }
    if(endParen < 0) this.err("Unmatched parentheses");
    this.index++;

    const name = this.parseOpOrTerm();
    this.index++;

    return new Call(line, name, this.parseFrom(this.index, endParen - 1));
  }

  private parseNumber(): Int | Float {
    let tokens: string[] = [];
    let sawDot = false;
    const line = this.line;

    this.whileValid(
      char => char.charCodeAt(0) >= ZERO && char.charCodeAt(0) <= NINE,
      char => {
        if(char === '.') {
          if(sawDot) this.err("Invalid `.`; expected digit");
          sawDot = true;
        }
        tokens.push(char);
      }
    );

    if(sawDot) return new Float(line, tokens.join(''));
    return new Int(line, tokens.join(''));
  }

  private err(msg: string) {
    throw new Error(`Line ${this.line}: ${msg}`);
  }
}
