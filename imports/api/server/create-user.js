import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

Accounts.onCreateUser(function(options, user) {
  // if (options.profile.hasOwnProperty('name')) {
  //   options.profile.fullName = options.profile.name;
  //   delete options.profile.name;
  // }

  if (user.services.google || user.services.facebook) {
    user.emails = [{ address: user.services.google.email || user.services.facebook.email }];
  }

  user.profile = Object.assign({}, options.profile, { role: 'user', firstLogin: true });

  // const location = TimeZones.findOne({ zip: options.profile.zipCode });
  // user.timeZone = location ? location.timezone : 'America/Chicago';

  // Meteor.call('registerUser', user.emails[0].address, user._id);
  return user;
});
