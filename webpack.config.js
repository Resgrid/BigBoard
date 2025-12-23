/* eslint-env node */
const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ensure import.meta is properly transformed
  config.module.rules.forEach((rule) => {
    if (rule.oneOf) {
      rule.oneOf.forEach((oneOfRule) => {
        if (oneOfRule.use && Array.isArray(oneOfRule.use) && oneOfRule.use.some((use) => use.loader && use.loader.includes('babel-loader'))) {
          oneOfRule.exclude = (input) => {
            // Don't exclude problematic packages from transpilation
            const shouldTranspile = /node_modules\/(acorn|cjs-module-lexer|@eslint|sucrase)/.test(input);
            if (shouldTranspile) {
              return false;
            }
            // Exclude other node_modules
            return /node_modules/.test(input);
          };
        }
      });
    }
  });

  return config;
};
