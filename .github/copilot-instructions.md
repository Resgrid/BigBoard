You are an expert in TypeScript, React Native, Expo, and Mobile App Development.

Code Style and Structure:

- Write concise, type-safe TypeScript code.
- Use functional components and hooks over class components.
- Ensure components are modular, reusable, and maintainable.
- Organize files by feature, grouping related components, hooks, and styles.
- This is a mobile application, so ensure all components are mobile friendly and responsive and support both iOS and Android platforms and ensure that the app is optimized for both platforms.

Naming Conventions:

- Use camelCase for variable and function names (e.g., `isFetchingData`, `handleUserInput`).
- Use PascalCase for component names (e.g., `UserProfile`, `ChatScreen`).
- Directory and File names should be lowercase and hyphenated (e.g., `user-profile`, `chat-screen`).

TypeScript Usage:

- Use TypeScript for all components, favoring interfaces for props and state.
- Enable strict typing in `tsconfig.json`.
- Avoid using `any`; strive for precise types.
- Utilize `React.FC` for defining functional components with props.

Performance Optimization:

- Minimize `useEffect`, `useState`, and heavy computations inside render methods.
- Use `React.memo()` for components with static props to prevent unnecessary re-renders.
- Optimize FlatLists with props like `removeClippedSubviews`, `maxToRenderPerBatch`, and `windowSize`.
- Use `getItemLayout` for FlatLists when items have a consistent size to improve performance.
- Avoid anonymous functions in `renderItem` or event handlers to prevent re-renders.

UI and Styling:

- Use consistent styling leveraging `gluestack-ui`. If there isn't a Gluestack component in the `components/ui` directory for the component you are trying to use consistently style it either through `StyleSheet.create()` or Styled Components.
- Ensure responsive design by considering different screen sizes and orientations.
- Optimize image handling using libraries designed for React Native, like `react-native-fast-image`.

Best Practices:

- Follow React Native's threading model to ensure smooth UI performance.
- Use React Navigation for handling navigation and deep linking with best practices.
- Create and use Jest to test to validate all generated components
- Generate tests for all components, services and logic generated. Ensure tests run without errors and fix any issues.
- The app is multi-lingual, so ensure all text is wrapped in `t()` from `react-i18next` for translations with the dictonary files stored in `src/translations`.
- Ensure support for dark mode and light mode.
- Ensure the app is accessible, following WCAG guidelines for mobile applications.
- Make sure the app is optimized for performance, especially for low-end devices.
- Handle errors gracefully and provide user feedback.
- Implement proper offline support.
- Ensure the user interface is intuitive and user-friendly and works seamlessly across different devices and screen sizes.

Additional Rules:

- Use `yarn` as the package manager.
- Use Expo's secure store for sensitive data
- Implement proper offline support
- Use `zustand` for state management
- Use `react-hook-form` for form handling
- Use `react-query` for data fetching
- Use `react-i18next` for internationalization
- Use `react-native-mmkv` for local storage
- Use `axios` for API requests
- Use `@rnmapbox/maps` for maps, mapping or vehicle navigation
- Use `lucide-react-native` for icons and use those components directly in the markup and don't use the gluestack-ui icon component
- Use ? : for conditional rendering and not &&
