import { Meteor } from 'meteor/meteor';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';
import { $ } from 'meteor/jquery';
import _ from 'underscore';

// Import layouts below
import '../../ui/layouts/layout.js';

// Import pages below
import '../../ui/pages/templates/users/user management/';
import '../../ui/pages/templates/users/user management/forgot-password.js';
import '../../ui/pages/templates/users/user management/join.js';
import '../../ui/pages/templates/users/user management/thankyou.js';
import '../../ui/pages/templates/users/user management/login.js';
import '../../ui/pages/templates/users/user management/terms-and-conditions.js';
import '../../ui/pages/templates/game/game-page.js';
import '../../ui/pages/templates/lobby/lobby.js';



FlowRouter.route('/', {
  name: 'join',
  action() {
    BlazeLayout.render('layoutNoUser', { main: 'join' });
  },
});

FlowRouter.route('/login', {
  name: 'login',
  action() {
    BlazeLayout.render('layoutNoUser', { main: 'login' });
  },
});

FlowRouter.route('/forgot-password', {
  name: 'forgotPassword',
  action() {
    BlazeLayout.render('layoutNoUser', { main: 'forgotPassword' });
  },
});

FlowRouter.route('/reset-password/:token', {
  name: 'resetPassword',
  action() {
    BlazeLayout.render('layoutNoUser', { main: 'resetPassword' });
  },
});

FlowRouter.route('/termsAndConditions', {
  name: 'termsAndConditions',
  action() {
    BlazeLayout.render('layoutNoUser', { main: 'termsAndConditions' });
  },
});

FlowRouter.route('/thankyou', {
  name: 'thankyou',
  action() {
    BlazeLayout.render('layoutNoUser', { main: 'thankyou',
                                        title: 'Coming Soon' });
  },
});


FlowRouter.route('/game-page', {
  name: 'gamePage',
  action() {
    BlazeLayout.render('layoutNoUser', { main: 'gamePage',
                                   title: 'Badassship' });
  },
});


FlowRouter.route('/lobby', {
  name: 'lobby',
  action() {
    BlazeLayout.render('layoutNoUser', { main: 'lobby',
                                   title: 'Badassship' });
  },
});


// Trigger functions - these are not reactive like they are in Iron Router
function checkLoggedIn(context, redirect) {
  if (!Meteor.userId()) {
    redirect('/tutorial');
  }
}

function alreadyUser(context, redirect) {
  if (Meteor.userId()) {
    redirect('/thankyou');
  }
}

function checkPullLog() {
  Meteor.call('pullLogItems');
}

function checkUpdated() {
  Meteor.call('checkForDeletes');
}

function checkPrefUpdate() {
  Meteor.call('checkPrefChange');
}

function storePrefs() {
  Meteor.call('storeCurPrefs');
}

function clearNullPending() {
  Meteor.call('removeNullMarker');
}

let previousPathsObj = {};
// these are the paths that we don't want to remember the scroll position for.
const exemptPaths = ['/fridge', '/showRecipes/*'];
function thisIsAnExemptPath(path) {
  let exemptPath = false;
  _.forEach(exemptPaths, (d) => {
    if (path.indexOf(d) >= 0) {
      exemptPath = true;
      return exemptPath;
    }
  });
  return exemptPath;
}

function saveScrollPosition(context) {
  const exemptPath = thisIsAnExemptPath(context.path);
  if (!exemptPath) {
    // add / update path
    previousPathsObj[context.path] = $('.content.has-header.overflow-scroll').scrollTop();
  }
}

function jumpToPrevScrollPosition(context) {
  let scrollPosition = 0;
  if (!_.isUndefined(previousPathsObj[context.path])) {
    scrollPosition = previousPathsObj[context.path];
  }
  if (scrollPosition === 0) {
    // we can scroll right away since we don't need to wait for rendering
    $('.content.has-header.overflow-scroll').animate({ scrollTop: scrollPosition }, 0);
  } else {
   // Now we need to wait a bit for blaze/react does rendering.
   // We assume, there's subs-manager and we've previous page's data.
   // Here 10 millis delay is a arbitrary value with some testing.
    setTimeout(() => {
      $('.content.has-header.overflow-scroll').animate({ scrollTop: scrollPosition }, 0);
    }, 10);
  }
}

const adminRoutes = ['updateResolvedIngredients', 'updateSpoilageTimes', 'adminViewRecipes', 'adminViewUsers'];
const notUserActions = ['login', 'termsAndConditions', 'join', 'forgotPassword', 'resetPassword'];

FlowRouter.triggers.enter([checkLoggedIn], { except: notUserActions.concat(['tutorial']) });
FlowRouter.triggers.enter([alreadyUser], { only: notUserActions });

// save and revert scroll position
FlowRouter.triggers.exit([saveScrollPosition]);
FlowRouter.triggers.enter([jumpToPrevScrollPosition]);
