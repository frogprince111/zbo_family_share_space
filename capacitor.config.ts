import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.frogprince.familysharespace',
  appName: '家庭共享空间',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  backgroundColor: '#F8F9FC',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#F8F9FC',
      showSpinner: false,
    },
    Keyboard: {
      resize: 'body',
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#F8F9FC',
    },
  },
}

export default config
