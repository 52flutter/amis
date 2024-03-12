import { Parser } from '.';
import ts, { SymbolFlags, TypeFlags, SyntaxKind } from 'typescript';

function getNextParentIds(parentIds: number[], type: ts.Type) {
  // @ts-ignore
  const id = type?.symbol?.id;
  if (id) {
    return [...parentIds, id];
  }
  return parentIds;
}

function getSymbolName(symbol: ts.Symbol) {
  // @ts-ignore
  const prefix: string = symbol?.parent && getSymbolName(symbol.parent);
  const name = symbol.getName();
  if (prefix && prefix.length <= 20) {
    return `${prefix}.${name}`;
  }
  return name;
}
const blacklistPatterns = [
  /^HTML/,
  /^React\./,
  /^Object$/,
  /^Date$/,
  /^Promise$/,
  /^XML/,
  /^Function$/,
];

function isComplexType(type: any) {
  let isAliasSymbol = false;
  let symbol = type?.symbol;
  if (!symbol) {
    symbol = type?.aliasSymbol;
    isAliasSymbol = true;
  }
  if (!symbol) return false;
  if (isAliasSymbol) {
    return false;
  }
  const name = getSymbolName(symbol);
  if (blacklistPatterns.some(patt => patt.test(name))) {
    return true;
  }
  return false;
}

function getFunctionReturns(
  node: any,
  checker: any,
  parentIds: any,
  type: any
) {
  if (!node) return {};
  const propType = getDocgenTypeHelper(
    checker,
    node?.type ? node.type : node,
    false,
    getNextParentIds(parentIds, type)
  );
  return {
    propType,
  };
}

function getFunctionParams(
  parameters: any[] = [],
  checker: any,
  parentIds: any,
  type: any
) {
  return parameters.map(node => {
    const typeObject = checker.getTypeOfSymbolAtLocation(
      node.symbol,
      node.symbol.valueDeclaration
    );
    const v = getDocgenTypeHelper(
      checker,
      typeObject,
      false,
      getNextParentIds(parentIds, type)
    );
    const name = node.symbol.escapedName;
    return {
      name,
      propType: v,
    };
  });
}

type ExtendedType = ts.Type & {
  id: string;
  typeArguments: any[];
};
export type JsonArray = Array<
  string | number | boolean | Date | Json | JsonArray
>;
export interface Json {
  [x: string]: string | number | boolean | Date | Json | JsonArray;
}
function getDocgenTypeHelper(
  checker: ts.TypeChecker,
  type: ts.Type,
  skipRequired = false,
  parentIds: number[] = [],
  isRequired = false
): any {
  function isTuple(_type: ts.Type) {
    // @ts-ignore use internal methods
    return checker.isArrayLikeType(_type) && !checker.isArrayType(_type);
  }
  let required: boolean;
  if (isRequired !== undefined) {
    required = isRequired;
  } else {
    required = !(type.flags & SymbolFlags.Optional) || isRequired;
  }

  function makeResult(typeInfo: Json) {
    if (skipRequired) {
      return {
        raw: checker.typeToString(type),
        ...typeInfo,
      };
    } else {
      return {
        required,
        raw: checker.typeToString(type),
        ...typeInfo,
      };
    }
  }

  function getShapeFromArray(symbolArr: ts.Symbol[], _type: ts.Type) {
    const shape: Array<{
      key:
        | {
            name: string;
          }
        | string;
      value: any;
    }> = symbolArr.map(prop => {
      const propType = checker.getTypeOfSymbolAtLocation(
        prop,
        // @ts-ignore
        prop.valueDeclaration ||
          (prop.declarations && prop.declarations[0]) ||
          {}
      );
      return {
        key: prop.getName(),

        value: getDocgenTypeHelper(
          checker,
          propType,
          false,
          // @ts-ignore
          getNextParentIds(parentIds, _type),
          // @ts-ignore
          !prop?.valueDeclaration?.questionToken
        ),
      };
    });
    // @ts-ignore use internal methods
    if (checker.isArrayLikeType(_type)) {
      return shape;
    }
    if (_type.getStringIndexType()) {
      // @ts-ignore use internal methods
      if (!_type.stringIndexInfo) {
        return shape;
      }
      shape.push({
        key: {
          name: 'string',
        },
        value: getDocgenTypeHelper(
          checker,
          // @ts-ignore use internal methods
          _type.stringIndexInfo.type,
          false,
          getNextParentIds(parentIds, _type)
        ),
      });
    } else if (_type.getNumberIndexType()) {
      // @ts-ignore use internal methods
      if (!_type.numberIndexInfo) {
        return shape;
      }
      shape.push({
        key: {
          name: 'number',
        },

        value: getDocgenTypeHelper(
          checker,
          // @ts-ignore use internal methods
          _type.numberIndexInfo.type,
          false,
          getNextParentIds(parentIds, _type)
        ),
      });
    }
    return shape;
  }

  function getShape(_type: ts.Type) {
    const { symbol } = _type;
    if (symbol && symbol.members) {
      // @ts-ignore
      const props: ts.Symbol[] = Array.from(symbol.members.values());
      // if (props.length >= 20) {
      //   throw new Error('too many props');
      // }
      return getShapeFromArray(
        props.filter(prop => prop.getName() !== '__index'),
        _type
      );
    } else {
      // @ts-ignore
      const args = _type.resolvedTypeArguments || [];
      const props = checker.getPropertiesOfType(_type);
      // if (props.length >= 20) {
      //   throw new Error('too many props');
      // }
      const shape = getShapeFromArray(props.slice(0, args.length), _type);
      return shape;
    }
  }

  // @ts-ignore
  if (type?.kind === SyntaxKind.VoidExpression) {
    return makeResult({
      name: 'void',
      raw: 'void',
    });
  }

  const pattern = /^__global\.(.+)$/;
  // @ts-ignore
  if (parentIds.includes(type?.symbol?.id)) {
    return makeResult({
      name: 'object', // checker.typeToString(type),
    });
  }
  if (type.symbol) {
    const symbolName = getSymbolName(type.symbol);
    if (symbolName) {
      const matches = pattern.exec(symbolName);
      if (matches) {
        return makeResult({
          name: matches[1],
        });
      }
    }
  }

  if (type.flags & TypeFlags.Number) {
    return makeResult({
      name: 'number',
    });
  } else if (type.flags & TypeFlags.String) {
    return makeResult({
      name: 'string',
    });
  } else if (type.flags & TypeFlags.NumberLiteral) {
    return makeResult({
      name: 'literal',
      // @ts-ignore
      value: type.value,
    });
  } else if (type.flags & TypeFlags.Literal) {
    return makeResult({
      name: 'literal',
      value: checker.typeToString(type),
    });
  } else if (type.symbol?.flags & SymbolFlags.Enum) {
    return makeResult({
      name: 'union',
      // @ts-ignore
      value: type.types.map(t => t.value),
    });
    // @ts-ignore
  } else if (type.flags & TypeFlags.DisjointDomains) {
    return makeResult({
      name: checker.typeToString(type),
    });
  } else if (type.flags & TypeFlags.Any) {
    return makeResult({
      name: 'any',
    });
  } else if (type.flags & TypeFlags.Union && !isComplexType(type)) {
    return makeResult({
      name: 'union',
      // @ts-ignore
      value: type.types.map(t =>
        getDocgenTypeHelper(checker, t, true, getNextParentIds(parentIds, type))
      ),
    });
  } else if (isComplexType(type)) {
    return makeResult({
      name: getSymbolName(type?.symbol || type?.aliasSymbol),
    });
  } else if (type.flags & (TypeFlags.Object | TypeFlags.Intersection)) {
    if (isTuple(type)) {
      try {
        const props = getShape(type);
        return makeResult({
          name: 'tuple',
          value: props.map(p => p.value),
        });
      } catch (e) {
        return makeResult({
          name: 'object',
        });
      }

      // @ts-ignore
    } else if (checker.isArrayType(type)) {
      return makeResult({
        name: 'Array',
        // @ts-ignore
        elements: [
          getDocgenTypeHelper(
            checker,
            (type as ExtendedType).typeArguments[0],
            false,
            getNextParentIds(parentIds, type)
          ),
        ],
      });
      // @ts-ignore
    } else if (type?.symbol?.valueDeclaration?.parameters?.length) {
      return makeResult({
        name: 'func',
        params: getFunctionParams(
          // @ts-ignore
          type?.symbol?.valueDeclaration?.parameters,
          checker,
          parentIds,
          type
        ),
        returns: getFunctionReturns(
          checker.typeToTypeNode(
            type,
            type?.symbol?.valueDeclaration,
            undefined
          ),
          checker,
          parentIds,
          type
        ) as any,
      });
    } else if (
      // @ts-ignore
      type?.members?.get('__call')?.declarations[0]?.symbol?.declarations[0]
        ?.parameters?.length
    ) {
      return makeResult({
        name: 'func',
        params: getFunctionParams(
          // @ts-ignore
          type?.members?.get('__call')?.declarations[0]?.symbol?.declarations[0]
            ?.parameters,
          checker,
          parentIds,
          type
        ),
      });
    } else {
      try {
        const props = getShape(type);
        return makeResult({
          name: 'signature',
          type: {
            signature: {
              properties: props,
            },
          },
        });
      } catch (e) {
        return makeResult({
          name: 'object',
        });
      }
    }
  } else {
    return makeResult({
      name: 'object',
    });
  }
}

export class MyParser extends Parser {
  getDocgenType(propType: ts.Type): any {
    const parentIds: any[] = [];
    // @ts-ignore
    const parentId = propType?.symbol?.parent?.id;
    if (parentId) {
      parentIds.push(parentId);
    }
    // @ts-ignore
    const result = getDocgenTypeHelper(this.checker, propType, true, parentIds);
    return result;
  }

  // override the builtin method, to avoid the false positive
  public extractPropsFromTypeIfStatelessComponent(
    type: ts.Type
  ): ts.Symbol | null {
    const callSignatures = type.getCallSignatures();

    if (callSignatures.length) {
      // Could be a stateless component.  Is a function, so the props object we're interested
      // in is the (only) parameter.

      for (const sig of callSignatures) {
        const params = sig.getParameters();
        if (params.length === 0) {
          continue;
        }

        // @ts-ignore
        const returnSymbol = this.checker.getReturnTypeOfSignature(sig);
        if (!returnSymbol) continue;
        const symbol = returnSymbol?.symbol;
        if (!symbol) continue;
        // @ts-ignore
        const typeString = this.checker.symbolToString(symbol);
        if (
          typeString.startsWith('ReactElement') ||
          typeString.startsWith('Element') ||
          typeString.startsWith('RaxElement')
        ) {
          const propsParam = params[0];
          if (propsParam) {
            return propsParam;
          }
        }
      }
    }

    return null;
  }
}
