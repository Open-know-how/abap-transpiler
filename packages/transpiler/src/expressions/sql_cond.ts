import {Nodes} from "@abaplint/core";
import * as abaplint from "@abaplint/core";
import {IExpressionTranspiler} from "./_expression_transpiler";
import {Traversal} from "../traversal";
import {Chunk} from "../chunk";
import {SimpleSource3Transpiler} from "./simple_source3";
import {FieldChainTranspiler} from "./field_chain";

export class SQLCondTranspiler implements IExpressionTranspiler {

  public transpile(node: Nodes.ExpressionNode, traversal: Traversal): Chunk {
    let ret = "";
    for (const c of node.getChildren()) {
      if (c instanceof abaplint.Nodes.ExpressionNode
          && c.get() instanceof abaplint.Expressions.SQLCompare) {
        if (ret !== "") {
          ret += " ";
        }
        if (c.findDirectExpression(abaplint.Expressions.Dynamic)) {
          const chain = c.findDirectExpression(abaplint.Expressions.Dynamic)?.findFirstExpression(abaplint.Expressions.FieldChain);
          if (chain) {
            const code = new FieldChainTranspiler(true).transpile(chain, traversal).getCode();
            ret += `" + ${code} + "`;
          } else {
            throw new Error("SQL Condition, transpiler todo, dyn cond, " + c.concatTokens());
          }
        } else if (c.findDirectExpression(abaplint.Expressions.SQLIn)) {
          ret += this.sqlIn(c, traversal);
        } else {
          ret += this.basicCondition(c, traversal);
        }
      } else if (c instanceof abaplint.Nodes.ExpressionNode) {
        ret += " " + this.transpile(c, traversal).getCode();
      } else {
        ret += " " + c.concatTokens();
      }
    }

    const c = new Chunk();
    return c.appendString(ret.trim());
  }

  private sqlIn(c: abaplint.Nodes.ExpressionNode, _traversal: Traversal): string {
    const fieldName = c.findDirectExpression(abaplint.Expressions.SQLFieldName);
    const slqin = c.findDirectExpression(abaplint.Expressions.SQLIn);
    const source = c.findFirstExpression(abaplint.Expressions.SimpleSource3);
    if (fieldName === undefined || slqin === undefined || source === undefined) {
      throw new Error("SQL Condition, transpiler todo, " + c.concatTokens());
    }

    const ret = `" + abap.expandIN("${fieldName.concatTokens()}", ${source.concatTokens()}) + "`;

    return ret;
  }

  private basicCondition(c: abaplint.Nodes.ExpressionNode, traversal: Traversal): string {
    let ret = "";
    if (c.getChildren().length !== 3) {
      throw new Error("SQL Condition, transpiler todo, " + c.concatTokens() + ", " + c.getChildren().length);
    }
    const fieldName = c.findDirectExpression(abaplint.Expressions.SQLFieldName);
    const operator = c.findDirectExpression(abaplint.Expressions.SQLCompareOperator);
    const source = c.findDirectExpression(abaplint.Expressions.SQLSource);
    if (fieldName === undefined || operator === undefined || source === undefined) {
      throw new Error("SQL Condition, transpiler todo, " + c.concatTokens());
    }

    ret += fieldName.concatTokens() + " " + operator.concatTokens() + " ";

    const simple = source.findDirectExpression(abaplint.Expressions.SimpleSource3);
    if (simple && simple.findDirectExpression(abaplint.Expressions.Constant) === undefined) {
      ret += "'\" + " + new SimpleSource3Transpiler(true).transpile(simple, traversal).getCode() + " + \"'";
    } else {
      ret += source.concatTokens();
    }
    return ret;
  }

}