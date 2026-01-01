import React from 'react';

import { Dashboard } from '@/components/Dashboard';
import { Box } from '@/components/ui/box';

export default function Home() {
  return (
    <Box className="flex-1" testID="home-screen">
      {/* Dashboard with customizable widgets */}
      <Dashboard />
    </Box>
  );
}
