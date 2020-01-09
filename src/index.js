const parser  = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babelTypes = require('babel-types');
const babelGenarate  = require('babel-generator').default;
const { RawSource } = require("webpack-sources");

let cssCode = '';
const MyVisitor = {
    MemberExpression(path) {
        const parentNode = path.parentPath.node;
        // 兼容dui组件库独特的插入style方式
        if (
            path.node.property.name === 'injectStyle' &&
            babelTypes.isCallExpression(parentNode)
         ) {
            const arguments = parentNode.arguments;
            if (arguments.length === 2) {
                cssCode += '\n' + arguments[1].extra.rawValue;
            }
            path.parentPath.remove();
        }

        /**
         * exports.push([module.i, "html,\nbody {\n  margin: 0;\n}\n", ""]);
         * 这里判断是否是styleLoader注入的css，有几个严格条件，如果还雷同，那就再具体问题兼容
         * 1. push操作且参数是一个
         * 2. 参数是三个，且第一个是isMemberExpression，第2、3个是字符串
         * 3. 第一个参数的property的name是i
         */
        if (
            path.node.property.name === 'push' &&
            babelTypes.isCallExpression(parentNode)
         ) {
            const arguments = parentNode.arguments;
            if (arguments.length === 1 && babelTypes.isArrayExpression(arguments[0])) {
                let arrayArg = arguments[0];
                    if (arrayArg.elements.length === 3) {
                        const arrayArgs = arrayArg.elements;
                        if (
                            babelTypes.isMemberExpression(arrayArgs[0])
                            && babelTypes.isStringLiteral(arrayArgs[1])
                            && babelTypes.isStringLiteral(arrayArgs[2])
                            && arrayArgs[0].property.name === 'i'
                        )
                        cssCode += '\n' + arrayArgs[1].value;
                        path.parentPath.remove();
                    }
            }
        }
        
    }
};

class ExtraNodeModulesCSSPlugin {
    constructor(options) {
        this.pluginName = 'ExtraNodeModulesCSSPlugin';
        this.options = options;
    }

    apply(compiler) {
        compiler.hooks.compilation.tap(
            this.pluginName,
            (compilation) => {
                compilation.hooks.optimizeChunkAssets.tap(this.pluginName, (chunks) => {
                    for (const chunk of chunks) {
                        cssCode = ''
                        chunk.files.forEach((filename) => {
                            if (filename.endsWith('.js')) {
                                let source = compilation.assets[filename].source();
                                const ast = parser.parse(source);
                                if (
                                    source.indexOf('injectStyle') > -1 ||
                                    (source.indexOf('push') > -1 && source.indexOf('.i') > -1)
                                ) {
                                    traverse(ast, MyVisitor);
                                    compilation.updateAsset(
                                        filename,
                                        old => new RawSource(babelGenarate(ast).code)
                                    );
                                }
                            }
                        });
                        if (cssCode.length > 0) {
                            const fileNameFormat = this.options && this.options.filename || '[name]-extra.css';
                            const chunkName = compilation.getPath(fileNameFormat, {
                                chunk: chunk
                            });
                            compilation.emitAsset(
                                chunkName,
                                new RawSource(cssCode)
                            );
                        }
                        cssCode = ''
                    }
                })
            }
        );
    }
}

module.exports = ExtraNodeModulesCSSPlugin;