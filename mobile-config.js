App.info({
  name: 'Badassship',
  description: 'It is Badass',
  author: 'The captain',
  website: 'http://www.badassship.com',
  // swap this out in build script as we are using different id for android and iOS
  id: 'APP_ID_HERE',
  version: '1.0.0',
  buildNumber: '1',
});


App.icons({
  // iOS
});

App.launchScreens({
  // iOS
});

App.setPreference('AutoHideSplashScreen' ,'true');
App.setPreference('StatusBarOverlaysWebView', false);
App.setPreference('Fullscreen', false);

App.accessRule('http://*');
App.accessRule('https://*');
App.accessRule('https://fonts.googleapis.com/icon?family=Material+Icons');
App.accessRule('https://fonts.googleapis.com/icon?family=Material+Icons');
App.accessRule('*');
