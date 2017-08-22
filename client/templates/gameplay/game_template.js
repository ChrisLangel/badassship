var stage = []; //store piece placements here before sending to the server

function stagePlacement(roomId, letter, rackId, tileId) {
    if (tileId === false) return Errors.throw('Select a tile first.');
    else if (letter === false && rackId === false) {
        return Errors.throw('Select a rack letter first.');
    }

    //get the current room's data
    var gameData = GameRooms.findOne(roomId, {
        fields: {
            playerRacks: 1,
            playerOneTiles: 1,
            playerTwoTiles: 1,
            tiles: 1,
            tilesOpponent: 1,
            turn: 1
        }
    });

    //can only place on their turn
    if (gameData.turn !== Meteor.userId()) {
        return Errors.throw('It isn\'t your turn!');
    }

    //bunch of convenience variables
    var tiles = gameData.tiles;
    var rack = gameData.playerRacks[Meteor.userId()];
    var rackLetter = letter ? letter : rack[rackId].letter;
    var tileLetter = tiles[tileId].letter;

    //deal with the few different tile-rack cases
    if (rackLetter !== false && tileLetter !== false) {
        return Errors.throw('There\'s already a letter in that tile.');
    } else if (rackLetter !== false && tileLetter === false) {
        //find the rack id if you have to
        if (rackId === false) {
            for (var ai = 0; ai < rack.length; ai++) {
                var rawRackLtr = rack[ai].letter;
                var rackLtr = rawRackLtr ? rawRackLtr.toUpperCase() : rawRackLtr;
                var lettersMatch = letter === rackLtr;
                if (lettersMatch && rackLtr !== false) {
                    rackId = ai;
                    break;
                }
            }
            if (rackId === false) return;
        }

        //update the LOCAL collection after placing the letter
        tiles[tileId].letter = rackLetter;
        tiles[tileId].score = rack[rackId].score;
        rack[rackId].letter = false;
        rack[rackId].score = false;
        var propsToUpdate = {
            tiles: tiles
        };
        propsToUpdate['playerRacks.'+Meteor.userId()] = rack;
        GameRooms._collection.update(roomId, {
            $set: propsToUpdate
        });

        //remember your changes so you can undo them later
        stage.push([tileId, rackLetter]);

        //get the next tile id
        var nextTileId = false;
        if (stage.length >= 2) {
            var axisAligned = [0, 1].map(function(axis) {
                return stage.map(function(placement) {
                    return [
                        placement[0]%15,
                        Math.floor(placement[0]/15)
                    ];
                }).reduce(function(acc, coords, idx) {
                    if (idx === 0) return [coords, true];
                    else {
                        return [coords, coords[axis]===acc[0][axis]&&acc[1]];
                    }
                }, false)[1];
            });
            var tileX = tileId%15;
            var tileY = Math.floor(tileId/15);
            if (axisAligned[0]) tileY = Math.min(tileY+1, 14);
            else if (axisAligned[1]) tileX = Math.min(tileX+1, 14);

            nextTileId = tileX+15*tileY;
            if (nextTileId === tileId) nextTileId = false;
        }

        //update session variables
        Session.set('selected-letter', false);
        Session.set('selected-rack-item', false);
        Session.set('selected-tile', nextTileId);
    }
}

// Create a function that returns the closest value in array
//
function closestValue(array, value) {
    var result,
        lastDelta;

    array.some(function (item) {
        var delta = Math.abs(value - item);
        if (delta >= lastDelta) {
            return true;
        }
        result = item;
        lastDelta = delta;
    });
    return result;
}


Template.gameTemplate.onCreated(function() {
    //reset session variables
    Session.set('selected-letter', false);
    Session.set('selected-rack-item', false);
    Session.set('selected-tile', false);
    Session.set('current-turn', false);
});

Template.gameTemplate.onRendered(function() {
    document.addEventListener('keydown', function(e) {
        var selLetter = String.fromCharCode(e.keyCode);
        var sl = Session.get('selected-letter');
        var sr = Session.get('selected-rack-item');
        var st = Session.get('selected-tile');
        if (st !== false) {
            var roomId = Router.current().params._id;
            return stagePlacement(roomId, selLetter, false, st);
        } else {
            Session.set('selected-letter', selLetter);
            Session.set('selected-rack-item', false);
            Session.set('selected-tile', false);
        }
    });

    // make the ship images draggable
    $('#ship1').draggable();
    $('#ship2').draggable();
    $('#ship3').draggable();
    $('#ship4').draggable();

});

Template.gameTemplate.helpers({

    isWinner: function() {
      var rawData = GameRooms.findOne(this._id, {
          fields: {
              winner: 1
          }
      });
      if (rawData.winner) {
        return Meteor.userId() === rawData.winner.winnerId;
      }
      return false
    },

    gameData: function() {
        var rawData = GameRooms.findOne(this._id, {
            fields: {
                tiles: 1,
                players: 1,
                tilesOpponent: 1,
                playerOneTiles: 1,
                playerTwoTiles: 1,
                title: 1,
                turn: 1,
                winner: 1
            }
        });
        if (!rawData) return [];

        //detect turn changes
        if (rawData.turn !== Session.get('current-turn')) {
            if (Session.get('current-turn') !== false) {
                // var beep = new Audio('/audio/beep.mp3');
                // beep.play();
            }
            var turnPref = 'YOUR TURN - ';
            if (document.title.indexOf(turnPref) === 0) { //already there
                if (rawData.turn !== Meteor.userId()) { //not them
                    document.title = document.title.substring(
                        turnPref.length
                    ); //get rid of it
                }
            } else { //it isn't there
                if (rawData.turn === Meteor.userId()) { //it is them
                    document.title = turnPref+document.title;
                }
            }

            Session.set('current-turn', rawData.turn);
        }

        // Check if the user is highlighting this tile
        for (var ti = 0; ti < rawData.tiles.length; ti++) {
            if (ti === Session.get('selected-tile')) {
                rawData.tiles[ti].selectedClass = 'selected';
            }
        }

        var tiles = []
        var tilesOpponent = []
        if (Meteor.userId() === rawData.players[0]._id) {
            tiles = rawData.playerTwoTiles
            tilesOpponent = rawData.playerOneTiles
        } else {
            tiles = rawData.playerOneTiles
            tilesOpponent = rawData.playerTwoTiles
        }

        return {
            tiles: tiles,
            tilesOpponent: tilesOpponent,
            title: rawData.title || 'Game board',
            winner: rawData.winner
        };
    },

    playersAndScores: function() {
        var rawData = GameRooms.findOne(this._id, {
            fields: {
                players: 1, //array of {ids,usernames}
                playerScores: 1, //object of ids -> scores
                turn: 1
            }
        });
        var playerList = [];
        if (!rawData || !rawData.players) return playerList;
        for (var pi = 0; pi < rawData.players.length; pi++) {
            var playersId = rawData.players[pi]._id;
            playerList.push({
                username: rawData.players[pi].username,
                score: rawData.playerScores[playersId],
                isTurn: rawData.turn === playersId ? 'is-turn':''
            });
        }
        return playerList;
    }
});

Template.gameTemplate.events({
    'click .tile-elem, click .tile-letter': function(e, tmpl) {
        e.preventDefault();


        var roomId = Template.parentData(1)._id;
        var gameData = GameRooms._collection.findOne(roomId, {
            fields: {
                playerOneTiles: 1,
                playerTwoTiles: 1,
                players: 1,
            }
        });
        var tileId = parseInt(e.target.id.split('-')[1]);
        var st = Session.get('selected-tile');
        Session.set('selected-tile', tileId === st ? false : tileId);

        var propsToUpdate = {};
        if (Meteor.userId() === gameData.players[0]._id) {
            var tiles = gameData.playerTwoTiles;
            for (var i=0; i<tiles.length; i++) {
                tiles[i].selectedClass = 'none'
            }
            tiles[tileId].selectedClass = 'selected';

            propsToUpdate['playerTwoTiles'] = tiles;
        } else {
            var tiles = gameData.playerOneTiles;
            for (var i=0; i<tiles.length; i++) {
                tiles[i].selectedClass = 'none'
            }
            tiles[tileId].selectedClass = 'selected';
            propsToUpdate['playerOneTiles'] = tiles;
        }

        GameRooms._collection.update(roomId, {
            $set: propsToUpdate
        });

    },

    'click #fire-btn': function(e, tmpl) {
        e.preventDefault();
        var gameData = GameRooms._collection.findOne(this._id, {
            fields: {
                players: 1,
                // playerRacks: 1,
                // tiles: 1,
                turn: 1,
            }
        });
        // var tiles = gameData.tiles;
        var st = Session.get('selected-tile');

        // need to call meteor method
        // 'makeMoveNew': function(roomId,tileId) {
        Meteor.call('makeMoveNew',
              this._id,
              st,
              function(err, result) {
                  if (err) return Errors.throw(err.reason);

                  if (result.notInRoom) {
                      return Errors.throw(
                          'You\'re not in this game room.'
                      );
                  } else if (result.gameOver) {
                      return Errors.throw(
                          'This game is already over.'
                      );
                  } else if (result.notSet) {
                      return Errors.throw(
                          'Not all players are set.'
                      );
                  } else if (result.notTheirTurn) {
                      return Errors.throw(
                          'It isn\'t your turn!'
                      );

                      //ga
                      ga('send', 'event', 'game', 'move','word');
                      if (result.gameOver) {
                          ga('send', 'event', 'game', 'end');
                      }
                  }
              }
        );
    },

    'click #submit-move-btn': function(e, tmpl) {
        e.preventDefault();

        Meteor.call(
            'makeMove',
            this._id,
            stage,
            function(err, result) {
                if (err) return Errors.throw(err.reason);

                if (result.notInRoom) {
                    return Errors.throw(
                        'You\'re not in this game room.'
                    );
                } else if (result.gameOver) {
                    return Errors.throw(
                        'This game is already over.'
                    );
                } else if (result.notTheirTurn) {
                    return Errors.throw(
                        'It isn\'t your turn!'
                    );
                } else if (result.invalidRackId) {
                    return Errors.throw(
                        'One of the letters you\'ve selected is invalid.'
                    );
                } else if (result.invalidTileId) {
                    return Errors.throw(
                        'You can only place letters on empty tiles.'
                    );
                } else if (result.mustPlaceCenter) {
                    return Errors.throw(
                        'The first word has to go through the center.'
                    );
                } else if (result.doesNotBranch) {
                    return Errors.throw(
                        'New words need to branch off of old words.'
                    );
                } else if (result.notALine) {
                    return Errors.throw(
                        'All of your letters need to be in a single line.'
                    );
                } else if (result.notConnected) {
                    return Errors.throw(
                        'All of your letters need to be connected.'
                    );
                } else if (!!result.notAWord) {
                    return Errors.throw(
                        'The following words were invalid: '+
                        result.notAWord.join(', ')
                    );
                } else if (result.success) {
                    stage = []; //clear the stage; these changes will live on!

                    //ga
                    ga('send', 'event', 'game', 'move','word');
                    if (result.gameOver) {
                        ga('send', 'event', 'game', 'end');
                    }
                }
            }
        );
    },

    'click #pass-move-btn': function(e, tmpl) {
        e.preventDefault();

        if (confirm('Are you sure you want to pass your turn?')) {
            Meteor.call(
                'makeMove',
                this._id,
                [false],
                function (err, result) {
                    if (err) return Errors.throw(err.reason);

                    if (result.notInRoom) {
                        return Errors.throw(
                            'You\'re not in this game room.'
                        );
                    } else if (result.gameOver && !result.success) {
                        return Errors.throw(
                            'This game is already over.'
                        );
                    } else if (result.notTheirTurn) {
                        return Errors.throw(
                            'It isn\'t your turn!'
                        );
                    } else {
                        //ga
                        ga('send', 'event', 'game', 'move', 'pass');
                        if (result.gameOver) {
                            ga('send', 'event', 'game', 'end');
                        }
                    }
                }
            );
        }
    },

    'click #set-btn': function(e, tmpl) {
        e.preventDefault();

        var gameData = GameRooms._collection.findOne(this._id, {
            fields: {
                p1Set: 1,
                p2Set: 1,
            }
        });

        // This is a dreadfully manual process
        // Ship #1
        var leftVals1 = [15,60,105,150,190,235]
        var topVals1 = [125,170,215,260,305,350,395,440,485,530]

        var top1num = closestValue(topVals1, $('#ship1').position().top)
        var left1num = closestValue(leftVals1, $('#ship1').position().left)
        var left1 = left1num.toString() + 'px'
        var top1 = top1num.toString() + 'px'

        // Ok so now we need to figure out index of tiles this one is on
        var indx = leftVals1.indexOf(left1num)
        var indy = topVals1.indexOf(top1num)
        var strInd = indy*10 + indx
        var ship1 = []
        for (var i=strInd; i<strInd+5; i++) {
          ship1.push(i)
        }

        // Ship #2
        var leftVals2 = [15,62,108,158,200]
        var topVals2 = [118,160,205,252,297,342,387,434,478,524]

        var top2num = closestValue(topVals2, $('#ship2').position().top)
        var left2num = closestValue(leftVals2, $('#ship2').position().left)
        var left2 = left2num.toString() + 'px'
        var top2 = top2num.toString() + 'px'
        //
        var indx = leftVals2.indexOf(left2num)
        var indy = topVals2.indexOf(top2num)
        var strInd = indy*10 + indx
        var ship2 = []
        for (var i=strInd; i<strInd+6; i++) {
          ship2.push(i)
        }

        // Ship #3
        var leftVals3 = [15,62,108,158,200,245,290,335]
        var topVals3 = [118,160,205,252,297,342,387,434,478,524]

        var left3num = closestValue(leftVals3, $('#ship3').position().left)
        var top3num = closestValue(topVals3, $('#ship3').position().top)
        var left3 = left3num.toString() + 'px'
        var top3 = top3num.toString() + 'px'
        //
        var indx = leftVals3.indexOf(left3num)
        var indy = topVals3.indexOf(top3num)
        var strInd = indy*10 + indx
        var ship3 = []
        for (var i=strInd; i<strInd+3; i++) {
          ship3.push(i)
        }


        // Ship #4
        var leftVals4 = [5,50,95,140,185,230,275,320,365,410]
        var topVals4 = [132,180,225,270,315]

        // There is a fudge factor ehere
        var left4num = closestValue(leftVals4, $('#ship4').position().left)
        var top4num = closestValue(topVals4, $('#ship4').position().top)
        var left4 = left4num.toString() + 'px'
        var top4 = top4num.toString() + 'px'
        //
        var indx = leftVals4.indexOf(left4num)
        var indy = topVals4.indexOf(top4num)
        var strInd = indy*10 + indx
        var ship4 = []
        for (var i=0; i<6; i++) {
          ship4.push(strInd + i*10)
        }

        // Update all this info in the database
        Meteor.call('setShips', this._id, ship1, ship2, ship3, ship4)


        // Don't drag anything until after all calculations are made
        $('#ship1').draggable('disable')
        $('#ship1').css({ "left": left1, "top": top1});
        $('#ship1').css("position", "absolute");

        $('#ship2').draggable('disable')
        $('#ship2').css({ "left": left2, "top": top2});
        $('#ship2').css("position", "absolute");

        $('#ship3').draggable('disable')
        $('#ship3').css({ "left": left3, "top": top3});
        $('#ship3').css("position", "absolute");

        $('#ship4').draggable('disable')
        $('#ship4').css({ "left": left4, "top": top4});
        $('#ship4').css("position", "absolute");

    }
});
