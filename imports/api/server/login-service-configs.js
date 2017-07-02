Meteor.startup(() => {
  ServiceConfiguration.configurations.update(
    { service: "facebook" },
    {
      $set: {
        appId: "888960507868686",
        loginStyle: "popup",
        secret: "8b019e7905932102a9bec91d4f3c8aac"
      }
    }
  );

  ServiceConfiguration.configurations.update(
    { service: "twitter" },
    {
      $set: {
        consumerKey: "FlZhgbuHL8U0idP5yM9CPIS0n",
        loginStyle: "popup",
        secret: "Jnc1RzZInJegf4SxrpKqxrw8Fh4L5SOGmGXYIXQwTFvwbAkX6f"
      }
    }
  );

  ServiceConfiguration.configurations.update(
    { service: "google" },
    {
      $set: {
        clientId: "678318089576-92b0ghl6uq5k0ovdbdd5okfslg0sbenl.apps.googleusercontent.com",
        loginStyle: "popup",
        secret: "pMYaHmI9aOk7hdoes_zQdedX"
      }
    }
  );
});
