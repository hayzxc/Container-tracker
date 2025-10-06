import type { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.311846ca6f6647409582ef268244c98c',
  appName: 'Container Tracker',
  webDir: 'dist',
  server: {
    url: 'https://311846ca-6f66-4740-9582-ef268244c98c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Camera: {
      presentationStyle: 'fullscreen'
    }
  }
};

export default config;
