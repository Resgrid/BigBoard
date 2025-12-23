module.exports = function (api) {
  api.cache(true);

  // Check if we're in test environment
  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: isTest
      ? ['babel-preset-expo'] // No nativewind in test environment
      : [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
            '@env': './src/lib/env.js',
            '@unitools/image': '@unitools/image-expo',
            '@unitools/router': '@unitools/router-expo',
            '@unitools/link': '@unitools/link-expo',
            '@tailwind.config': './tailwind.config.js',
            '@assets': './assets',
          },
          extensions: ['.ios.ts', '.android.ts', '.ts', '.ios.tsx', '.android.tsx', '.tsx', '.jsx', '.js', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
