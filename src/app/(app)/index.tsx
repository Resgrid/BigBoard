import { Redirect } from 'expo-router';
import React from 'react';

/**
 * Root index page for the authenticated app.
 * Redirects to the home page which serves as the main dashboard.
 */
export default function AppIndex() {
  return <Redirect href="/(app)/home" />;
}
