import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { FridgeInventory } from './fridgeInventory.js';

import moment from 'moment';
import _ from 'underscore';

export const PushMessages = new Mongo.Collection('pushMessages');

Meteor.methods({
  addPush(items, message, sendTime) {
    check(items, [String]);
    check(message, String);
    PushMessages.insert({
      items,
      message,
      sendTime,
      createdAt: moment().toDate(),
    });
    // update all messages to time stated
    PushMessages.update({}, {
      $set: {
        sendTime,
      },
    }, {
      multi: true,
    });
  },
  removePush(id) {
    check(id, String);
    PushMessages.remove({
      _id: id,
    });
  },
  // this is a pretty intricate function, pass in genericMessages as array
  // so we don't hit database for every user
  sendPush(userId, genericMessages) {
    const oneDay = 24 * 60 * 60 * 1000;
    const spoiledItems = [];
    const fridgeArray = [];
    const fridgeItems = FridgeInventory.find({
      userId,
      deleteByUser: false,
      eatenByUser: false,
    }).fetch();
    fridgeItems.forEach((item) => {
      fridgeArray.push(item.foodItem.toLowerCase());
      const daysLeft = Math.round((new Date(item.expiredAt).getTime() - new Date().getTime())/(oneDay));
      if (daysLeft < 1) {
        spoiledItems.push(item.foodItem.toLowerCase());
      }
    });

    // don't bother calling this if the user does not have any expired items
    if (spoiledItems.length) {
      const user = Meteor.users.findOne({ _id: userId });
      const pushHistory = user.pushHistory || [];
      let message = '';
      let hour = '16:00';

      // start by looking for specific messages related to this users items
      spoiledItems.forEach((item) => {
        const tempMessage = PushMessages.find({
          items: {
            $elemMatch: {
              $regex: item,
              $options: 'i',
            },
          },
        }).fetch();
        tempMessage.forEach((mess) => {
          // there are numerous items in this message so check if user has them
          if (mess.items.length > 1) {
            const otherItems = _.difference(mess.items, [item]);
            const matching = _.intersection(otherItems, fridgeArray);
            if (matching.length && pushHistory.indexOf(mess._id) < 0) {
              message = mess.message;
              hour = mess.sendTime;
              pushHistory.push(mess._id);
            }
          } else {
            // as we go down in this loop messages are less and less personal
            // so only use these if a message has not been set yet
            if (message === '' && pushHistory.indexOf(mess._id) < 0) {
              message = mess.message;
              hour = mess.sendTime;
              pushHistory.push(mess._id);
            }
          }
        });
      });
      // now we have looped through all the users expired items, if we still
      // don't have a message, loop through generic
      if (message === '') {
        genericMessages.forEach((mess) => {
          if (message === '' && pushHistory.indexOf(mess._id) < 0) {
            message = mess.message;
            hour = mess.sendTime;
            pushHistory.push(mess._id);
          }
        });
      }
      if (pushHistory.length > 10) {
        pushHistory.shift();
      }
      // we can play around with other replacements
      const itemText = spoiledItems.length === 1 ? '1 item' :
        `${spoiledItems.length.toString()} items`;
      message = message.replace('#NUMITEMS', itemText);
      message = message.replace('#ITEMNAME', spoiledItems[0]);

      // need to format date YYYY-MM-DD HH:mm
      const sendDay = moment().format('YYYY-MM-DD');
      const sendDate = `${sendDay} ${hour}`;

      // get users timeZone and deviceType
      const timeZone = user.timeZone || 'America/Chicago';
      const deviceType = user.deviceType || [1, 3];
      const num = spoiledItems.length;

      // look for a oneSigId, if user is on RN app should have one
      const oneSigId = user.oneSigId || '';
      if (oneSigId) {
        const gmtOffset = user.gmtOffset || 'GMT-0500';
        const sendAt = `${sendDate} ${gmtOffset}`;
        Meteor.call('setBadgeOneSig', userId, num);
        Meteor.call('sendPushOneSig', oneSigId, sendAt, message);
      }

      // pushwoosh code, in case users are still using the old app
      // we update the badge immediately, but send the notification at specific time
      Meteor.call('updateBadge', userId, num);
      Meteor.call('sendPushAPI', userId, deviceType, sendDate, timeZone, message);

      // save the most recent push history array
      Meteor.users.update({
        _id: userId,
      }, {
        $set: {
          pushHistory,
        },
      });
    }
  },
});
