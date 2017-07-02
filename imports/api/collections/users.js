import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import { check } from 'meteor/check';



validateSigninUser = function(user) {
  let errors = {};
  if (!user.email) {
    errors = 'Email is required.';
  }
  if (!user.password) {
    errors = 'Password is required.';
  }
  return errors;
}

validateJoinUser = function(user) {
  let errors = {};
  if (!user.email) {
    errors = 'Email is required.';
  }
  if (!user.password) {
    errors = 'Password is required.';
  }
  return errors;
}

validateResetPassword = function(user) {
  let errors = {};
  if (!user.password) {
    errors = 'You must enter a new password.';
  }
  if (!user.confirmPassword) {
    errors = 'You must confirm your password.';
  }
  if (user.password !== user.confirmPassword) {
    errors = 'Your passwords do not match.';
  }
  return errors;
}
