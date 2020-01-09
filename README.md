# extra-node-modules-css-plugin

## 介绍

一个用于将 由style-loader注入到js文件里面的css提取出来的 webpack 插件。
为什么会需要这个插件？起因是因为在用 kbone 开发同构小程序应用的时候，用到了一些 npm 包（多数是团队内部开发的），这些 npm 包都没有把css合并到一个单独文件，而是默认使用了 style-loader 来把这些 css 当做 module 注入了 js 。
我们都知道在小程序里面，因为 kbone 模拟了 dom 和 bom ，动态插入 style 标签这样的代码才不会报错，但是因为线程隔离，所以这些动态注入的 css 代码实际上也不会生效。
为了解决这个问题，就开发了这个插件，根据 style-loader 的语法来做词法分析，提取 css 内容，并且生成额外的 chunk 。

## 安装

```
npm install --save-dev extra-node-modules-css-plugin
```

## 使用

### Options

You can pass a hash of configuration options to `extra-node-modules-css-plugin`.
Allowed values are as follows

|Name|Type|Default|Description|
|:--:|:--:|:-----:|:----------|
|**`name`**|`{String}`|`[name]-extra.css`|生成的文件名，和 webpack 的 output 的 filename 格式一致|
