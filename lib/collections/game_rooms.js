GameRooms = new Meteor.Collection('gameRooms')

LETTER_PTS = {
    'a': 1, 'b': 2, 'c': 2, 'd': 2, 'e': 1,
    'f': 4, 'g': 3, 'h': 4, 'i': 1, 'j': 8,
    'k': 5, 'l': 1, 'm': 3, 'n': 1, 'o': 1,
    'p': 3, 'q': 10, 'r': 1, 's': 1, 't': 1,
    'u': 1, 'v': 4, 'w': 4, 'x': 8, 'y': 4,
    'z': 10
};


function unique(arrayName) {
    var newArray=new Array();
    label:for(var i=0; i<arrayName.length;i++ )
    {
        for(var j=0; j<newArray.length;j++ )
        {
            if(newArray[j]==arrayName[i])
                continue label;
        }
        newArray[newArray.length] = arrayName[i];
    }
    return newArray;
}

removeJoinAuth = function(userId, username, roomId) {
    //get rid of their currentGameRoom property
    Meteor.users.update({_id: userId}, {
        $set: {
            'profile.currentGameRoom': false,
            'profile.leftAt': false
        }
    });

    //remove them from the room's player list
    var gameRoom = GameRooms.findOne(roomId);
    if (!gameRoom) {
        return; //no room to remove them from
    }
    var idxInPlayers = false;
    if (!gameRoom.open) {
        idxInPlayers = gameRoom.players.reduce(
            function(ret, player, idx) {
                return gameRoom.turn === player._id ? idx : ret;
            }, false
        );
    } //for the purposes of seeing whose turn it is
    GameRooms.update({_id: roomId}, {
        $pullAll: {
            players: [{
                _id: userId,
                username: username
            }]
        }
    });

    //check to see if the room is then empty
    gameRoom = GameRooms.findOne({_id: roomId}); //updated
    var players = gameRoom.players;
    if (players.length === 0) {
        //their leaving the room made it empty
        GameRooms.remove({_id: roomId}); //so delete the room
    } else {
        //not empty so choose a new owner
        var newOwner = players[0];
        var updateObj = {
            userId: newOwner._id,
            author: newOwner.username
        };

        //if the game is going on, do some damage control
        // if (!gameRoom.open) {
        //     //if it was their turn and they left early
        //     if (gameRoom.turn === userId) {
        //         //find out who's going next
        //         var idNextPlayer = players[idxInPlayers]._id;
        //         updateObj.turn = idNextPlayer;
        //     }

            //put their rack letters back in the bag
            // var letterBag = gameRoom.letterBag;
            // var rackLetters = gameRoom.playerRacks[
            //     userId
            //     ].map(function(rackItem) {
            //         return rackItem.letter;
            //     });
            // rackLetters.map(function(letter) {
            //     if (letter === false) return;
            //     else {
            //         if (letterBag.hasOwnProperty(letter)) {
            //             letterBag[letter] += 1;
            //         } else {
            //             letterBag[letter] = 1;
            //         }
            //     }
            // });
            // updateObj.letterBag = letterBag;
        // }

        //make the update
        // var fieldsToUnset = {};
        // fieldsToUnset['playerRacks.'+userId] = '';
        GameRooms.update({_id: roomId}, {
            $set: updateObj,
            //delete their rack
            // $unset: fieldsToUnset
        });
    }
};

endGame = function(roomId) {
    var updatedRoom = GameRooms.findOne(roomId);
    var playerIds = updatedRoom.players.map(function(player) {
        return player._id;
    });
    var playerScores = playerIds.map(function(playerId) {
        return [playerId, updatedRoom.playerScores[playerId]]
    });
    var bestScore = playerScores.reduce(function(acc, scorePair) {
        return acc[1] > scorePair[1] ? acc : scorePair;
    });
    var winnerName = updatedRoom.players[
        playerIds.indexOf(bestScore[0])
    ].username;
    GameRooms.update(roomId, {
        $set: {
            winner: {
                winnerId: playerIds[playerIds.indexOf(bestScore[0])],
                username: winnerName,
                score: bestScore[1]
            },
            turn: false
        }
    });

    return {
        success: true,
        gameOver: true
    };
};

Meteor.methods({
    'addGameRoom': function(gameRoomInfo) {
        check(Meteor.userId(), String);
        check(gameRoomInfo, {
            title: String,
            maxPlayers: Number,
            password: String,
            passwordProtected: Boolean
        });

        var user = Meteor.user();
        var currRoomId = !!user.profile ? user.profile.currentGameRoom : false;
        var leftAt = !!user.profile ? user.profile.leftAt : false;
        if (!!currRoomId || !!leftAt) {
            return {
                alreadyInRoom: true
            };
        }

        gameRoomInfo.maxPlayers = Math.max(
            Math.min(gameRoomInfo.maxPlayers || 1, 8), 1
        );
        var gameRoom = _.extend(gameRoomInfo, {
            userId: user._id,
            author: user.username,
            players: [{
                _id: user._id,
                username: user.username
            }],
            open: true,
            createdAt: new Date()
        });

        var gameRoomId = GameRooms.insert(gameRoom);
        Meteor.users.update({_id: Meteor.userId()}, {
            $set: {
                'profile.currentGameRoom': gameRoomId,
                'profile.leftAt': false
            }
        });

        return {
            _id: gameRoomId
        }
    },

    'deleteGameRoom': function(roomId) {
        check(roomId, String);
        check(Meteor.userId(), String);

        var room = GameRooms.findOne(roomId);
        if (isRoomOwner(room)) {
            var players = room.players || [];
            players.map(function(player) {
                Meteor.users.update({_id: player._id}, {
                    $set: {
                        'profile.currentGameRoom': false,
                        'profile.leftAt': false
                    }
                });
            });
            GameRooms.remove(roomId);

            return {
                success: true
            };
        } else {
            return {
                notRoomOwner: true
            };
        }
    },

    'joinGameRoom': function(roomId, password) {
        check(roomId, String);
        check(password, String);

        var user = Meteor.user();
        if (!user) {
            return {
                notLoggedOn: true
            };
        }

        var currRoomId = !!user.profile ? user.profile.currentGameRoom : false;
        var leftAt = !!user.profile ? user.profile.leftAt : false;
        if (!!currRoomId || !!leftAt) {
            return {
                alreadyInRoom: true
            };
        } else {
            var gameRoom = GameRooms.findOne({_id: roomId});
            if (gameRoom.players.length >= gameRoom.maxPlayers) {
                return {
                    isAtCapacity: true
                };
            } else if (!gameRoom.open) {
                return {
                    alreadyStarted: true
                }
            } else if (password !== gameRoom.password) {
                return {
                    wrongPassword: true
                };
            } else {
                //not at capacity, not already in a room, correct password
                //so they're good to go!
                GameRooms.update({_id: roomId}, {
                    $addToSet: {
                        players: {
                            _id: Meteor.userId(),
                            username: Meteor.user().username
                        }
                    }
                });

                Meteor.users.update({_id: Meteor.userId()}, {
                    $set: {
                        'profile.currentGameRoom': roomId,
                        'profile.leftAt': false
                    }
                });

                return {
                    success: true
                }
            }
        }
    },

    'leaveRoom': function() {
        var user = Meteor.user();
        if (!user) return;

        var currRoomId = !!user.profile ? user.profile.currentGameRoom : false;
        var leftAt = !!user.profile ? user.profile.leftAt : false;
        if (!!leftAt) return; //already left; don't do anything
        var numRooms = GameRooms.find(currRoomId).count();
        if (numRooms > 0) { //they're leaving an actual room
            Meteor.users.update({_id: Meteor.userId()}, {
                $set: {
                    'profile.currentGameRoom': false,
                    'profile.leftAt': +new Date()
                }
            });
        } else { //the room they're leaving doesn't exist
            Meteor.users.update({_id: Meteor.userId()}, {
                $set: {
                    'profile.currentGameRoom': false,
                    'profile.leftAt': false
                }
            });
        }
    },

    'removeJoinAuth': function() {
        var user = Meteor.user();
        if (!user) {
            return {
                notLoggedOn: true
            };
        };

        var currRoomId = !!user.profile ? user.profile.currentGameRoom : false;
        if (!currRoomId) {
            return {
                notInRoom: true
            };
        }

        removeJoinAuth(Meteor.userId(), user.username, currRoomId);

        return {
            success: true
        };
    },

    'startGame': function(roomId) {
        check(roomId, String);

        var gameRoom = GameRooms.findOne(roomId);
        if (gameRoom.userId === Meteor.userId()) {

            var playerScores = {};
            var passedLastTurn = {};

            var numTiles = 10*10;
            var tiles = [];
            var tilesOpponent = [];
            for (var ai = 0; ai < numTiles; ai++) {
                var tile = {
                    _id: ai,
                    hit: false,
                    miss: false,
                    userId: false,
                    mult: 1
                };
                tiles.push(tile);
                tilesOpponent.push(tile);
            }

            //then they're the owner
            GameRooms.update(roomId, {
                $set: {
                    open: false,
                    playerScores: playerScores,
                    playerOneTiles: tiles,
                    playerTwoTiles: tiles,
                    tiles: tiles,
                    tilesOpponent: tilesOpponent,
                    turn: gameRoom.userId, //owner goes first
                    winner: false,
                    passedLastTurn: passedLastTurn,
                    p1set: false,
                    p2set: false,
                    p1hits: [],
                    p2hits: [],
                }
            });

            return {
                success: true
            };
        } else {
            return {
                notRoomOwner: true
            };
        }
    },

    //
    'setShips': function(roomId,ship1,ship2,ship3,ship4) {
        check(roomId, String);
        check(ship1, [Match.Any]);
        check(ship2, [Match.Any]);
        check(ship3, [Match.Any]);
        check(ship4, [Match.Any]);

        var gameRoom = GameRooms.findOne(roomId);
        if (gameRoom.userId === Meteor.userId()) {
            // then we are storing everything as player1
            // concatenate all arrays for now
            var allShips = ship1.concat(ship2).concat(ship3).concat(ship4)
            var allShip1 = unique(allShips)
            GameRooms.update(roomId, {
                $set: {
                  p1ship1: ship1,
                  p1ship2: ship2,
                  p1ship3: ship3,
                  p1ship4: ship4,
                  allShip1: allShip1,
                  p1set: true,
                }
            });
        } else {
            // then we are storing everything as player2
            var allShips = ship1.concat(ship2).concat(ship3).concat(ship4)
            var allShip2 = unique(allShips)
            GameRooms.update(roomId, {
                $set: {
                  p2ship1: ship1,
                  p2ship2: ship2,
                  p2ship3: ship3,
                  p2ship4: ship4,
                  allShip2: allShip2,
                  p2set: true,
                }
            });
        }
        return {
            success: true
        };

    },

    'makeMoveNew': function(roomId,tileId) {
        check(roomId, String);
        check(tileId, Match.Any);
        //find out if they're even in this room
        var gameRoom = GameRooms.findOne(roomId);
        var playerIds = GameRooms.findOne({_id: roomId}, {
            fields: {players: 1}
        }).players.map(function(player) {
            return player._id;
        });

        //make sure they're in this room
        if (playerIds.indexOf(Meteor.userId()) === -1) {
            return {
                notInRoom: true
            };
        }

        //make sure the game isn't over
        if (!!gameRoom.winner) {
            return {
                gameOver: true
            };
        }

        //make sure it's their turn
        if (gameRoom.turn !== Meteor.userId()) {
            return {
                notTheirTurn: true
            }
        }

        // make sure both players are set
        if (gameRoom.p1set === false || gameRoom.p2set === false) {
            return {
                notSet: true
            }
        }

        var tiles = []
        var shipArray = []
        // see what player this is
        if (Meteor.userId() == gameRoom.players[0]._id) {
            tiles = gameRoom.playerTwoTiles;
            shipArray = gameRoom.allShip2;
        } else {
            tiles = gameRoom.playerOneTiles;
            shipArray = gameRoom.allShip1;
        }


        var result = 'miss';
        var numHits = 0;
        if (shipArray.indexOf(tileId) !== -1) {
            // We have a hit !!
            result = 'hit';
            numHits = 1;
        }
        tiles[tileId].multClass = result
        tiles[tileId].multText = '&#9733;';

        //advance the turn to the next player
        var idxInPlayers = gameRoom.players.reduce(function(ret, player, idx) {
            return gameRoom.turn === player._id ? idx : ret;
        }, false);
        var idxNextPlayer = (idxInPlayers+1)%gameRoom.players.length;
        var nextTurn = gameRoom.players[idxNextPlayer]._id;

        //make the updates
        var propsToUpdate = {
            turn: nextTurn
        };

        // this could all be made much better
        if (Meteor.userId() === gameRoom.players[0]._id) {
            var hits = gameRoom.p1hits;
            if (result === 'hit') {
              hits.push(tileId);
            }
            hits = unique(hits);
            // var uniqueHits = unique(hits.push(tileId));
            // check if this user has won
            propsToUpdate['playerTwoTiles'] = tiles;
            propsToUpdate['p1hits'] = hits;
            if (hits.length === gameRoom.allShip2.length) {
                 return endGame(roomId);
            }

        } else {
            var hits = gameRoom.p2hits;
            if (result === 'hit') {
              hits.push(tileId);
            }
            hits = unique(hits);
            console.log(gameRoom.allShip1.length);
            console.log(hits.length);
            if (hits.length === gameRoom.allShip1.length) {
                 return endGame(roomId);
            }
        }

        var propsToInc = {};
        propsToUpdate['passedLastTurn.'+ Meteor.userId()] = false;
        propsToInc['playerScores.'+ Meteor.userId()] = numHits;
        GameRooms.update(roomId, {
            $set: propsToUpdate,
            $inc: propsToInc
        });

        return {
            success: true
        };

    },

    'makeMove': function(roomId, tilePlacements) {
        check(roomId, String);
        check(tilePlacements, [Match.Any]);

        //find out if they're even in this room
        var gameRoom = GameRooms.findOne(roomId);
        var playerIds = GameRooms.findOne({_id: roomId}, {
            fields: {players: 1}
        }).players.map(function(player) {
            return player._id;
        });

        //make sure they're in this room
        if (playerIds.indexOf(Meteor.userId()) === -1) {
            return {
                notInRoom: true
            };
        }

        //make sure the game isn't over
        if (!!gameRoom.winner) {
            return {
                gameOver: true
            };
        }

        //make sure it's their turn
        if (gameRoom.turn !== Meteor.userId()) {
            return {
                notTheirTurn: true
            }
        }

        if (tilePlacements[0] === false) { //indicates a pass
            //advance the turn to the next player
            var idxNextPlayer = (gameRoom.players.reduce(
                function(ret, player, idx) {
                    return gameRoom.turn === player._id ? idx : ret;
                }, false
            )+1)%gameRoom.players.length;
            var propsToSet = {
                turn: gameRoom.players[idxNextPlayer]._id
            };

            //keep track of the fact that they've passed
            propsToSet['passedLastTurn.'+Meteor.userId()] = true;
            GameRooms.update(roomId, {
                $set: propsToSet
            });

            //check for the everyone-has-passed end condition
            gameRoom.passedLastTurn[Meteor.userId()] = true;
            var allPassed = playerIds.reduce(function(acc, playerId) {
                return acc && gameRoom.passedLastTurn[playerId];
            }, true);
            if (allPassed) return endGame(roomId);

            return {
                success: true
            };
        }

        //make sure all their rack letters are valid
        var rack = gameRoom.playerRacks[Meteor.userId()];
        var placedTiles = tilePlacements.map(function(placement) {
            return placement[0];
        });
        var placedLetters = tilePlacements.map(function(placement) {
            return placement[1] ? placement[1].toUpperCase() : false;
        });
        var possessedLetters = rack.map(function(rackItem) {
            return rackItem.letter ? rackItem.letter.toUpperCase() : false;
        });
        for (var ai = 0; ai < placedLetters.length; ai++) {
            if (possessedLetters.indexOf(placedLetters[ai]) === -1) {
                return {
                    invalidRackId: true
                };
            }
        }

        //and all their tile selections
        var tiles = gameRoom.tiles;
        for (var ai = 0; ai < tilePlacements.length; ai++) {
            var tileId = tilePlacements[ai][0];
            if (tileId < 0 || tileId >= tiles.length || //invalid id
                !!tiles[tileId].letter) { //already a letter there
                return {
                    invalidTileId: true
                };
            }
        }

        //the center spot needs a tile, or they better be putting one there
        if (tiles[112].letter === false && placedTiles.indexOf(112) === -1) {
            return {
                mustPlaceCenter: true
            };
        }

        //placements must be in a horizontal or vertical line
        var coordsOfPlacements = tilePlacements.map(function(placement) {
            var x = placement[0]%15;
            var y = Math.floor(placement[0]/15);
            return [x, y];
        });
        var axisAligned = [0, 1].map(function(axis) {
            return coordsOfPlacements.reduce(function(acc, coords, idx) {
                if (idx === 0) return [coords, true];
                else {
                    return [coords, coords[axis] === acc[0][axis] && acc[1]];
                }
            }, false)[1];
        });
        if (!axisAligned[0] && !axisAligned[1]) {
            return {
                notALine: true
            };
        }

        //lines must be continuous; simultaneously get the letters in the main line
        var longAxis = axisAligned[0] ? 1 : 0; //how does the line vary
        var mainLine = getLinesFrom(coordsOfPlacements, tiles, longAxis);
        var longWord = getWordFromLineDefn(mainLine, tilePlacements, tiles, rack);
        if (longWord[0] === false) {
            return {
                notConnected: true
            };
        }

        //get all the perpendicular sublines
        var words = [];
        if (longWord[0].length > 1) words.push(longWord);
        for (var ai = 0; ai < coordsOfPlacements.length; ai++) {
            var line = getLinesFrom([coordsOfPlacements[ai]], tiles, 1-longAxis);
            var word = getWordFromLineDefn(line, tilePlacements, tiles, rack);
            if (!!word[0] && word[0].length > 1) words.push(word);
        }

        //make sure this line branches off another
        var numLetters = words.reduce(function(acc, word) {
            return acc + word[0].length;
        }, 0);
        if (numLetters <= placedLetters.length && //doesn't branch
            tiles[112].letter !== false) { //isn't first move
            //their words comprise fewer letters than they placed
            return {
                doesNotBranch: true
            };
        }

        //the immediate line and all sublines must be words
        var invalidWords = [];
        for (var wi = 0; wi < words.length; wi++) {
            if (!isValidWord(words[wi][0])) {
                invalidWords.push(words[wi][0]);
            }
        }
        if (invalidWords.length !== 0) {
            return {notAWord: invalidWords};
        }
        if (words.length === 0) {
            return {notAWord: longWord};
        }

        //calculate the number of points they get
        var points = words.reduce(function(total, word) {
            return total+word[1];
        }, 0);

        //make the changes to the local tiles and racks objects
        var letterBagIsEmpty = false;
        for (var ai = 0; ai < tilePlacements.length; ai++) {
            var tileId = tilePlacements[ai][0];
            tiles[tileId].letter = tilePlacements[ai][1];
            tiles[tileId].score = LETTER_PTS[
                tilePlacements[ai][1].toLowerCase()
            ];
            tiles[tileId].userId = Meteor.userId();

            //get a new letter for this user
            var letterBag = gameRoom.letterBag;
            var newLetter = getRandKeyFromCountSet(letterBag);
            letterBagIsEmpty = letterBagIsEmpty || !newLetter;
            var oldIdx = possessedLetters.indexOf(
                tilePlacements[ai][1]?tilePlacements[ai][1].toUpperCase():false
            );
            possessedLetters[oldIdx] = false;
            rack[oldIdx].letter = newLetter;
            rack[oldIdx].score = newLetter===false?false:LETTER_PTS[
                newLetter.toLowerCase()
            ];
        }
        var rackIsEmpty = rack.reduce(function(acc, rackItem) {
            return acc && !rackItem.letter;
        }, true);

        //advance the turn to the next player
        var idxInPlayers = gameRoom.players.reduce(function(ret, player, idx) {
            return gameRoom.turn === player._id ? idx : ret;
        }, false);
        var idxNextPlayer = (idxInPlayers+1)%gameRoom.players.length;
        var nextTurn = gameRoom.players[idxNextPlayer]._id;

        //make the updates
        var propsToUpdate = {
            letterBag: letterBag,
            tiles: tiles,
            turn: nextTurn
        };
        var propsToInc = {};
        propsToUpdate['passedLastTurn.'+Meteor.userId()] = false;
        propsToUpdate['playerRacks.'+Meteor.userId()] = rack;
        propsToInc['playerScores.'+Meteor.userId()] = points;
        GameRooms.update(roomId, {
            $set: propsToUpdate,
            $inc: propsToInc
        });

        //check for the no more tiles end condition
        var noMoreTiles = letterBagIsEmpty && rackIsEmpty;
        if (noMoreTiles) return endGame(roomId);

        return {
            success: true
        };
    },
});

function isValidWord(word) {
    var idx = getWordIdx(word);
    return idx !== -1;
}

function getWordIdx(word) {
    word = word.toUpperCase();
    var minIdx = 0, maxIdx = WORD_LIST.length;
    var idxInArr = -1;
    while (minIdx !== maxIdx && minIdx < WORD_LIST.length) {
        var idx = Math.floor((minIdx+maxIdx)/2);
        if (word === WORD_LIST[idx]) {
            idxInArr = idx;
            break;
        } else if (word > WORD_LIST[idx]) {
            minIdx = idx+1;
        } else {
            maxIdx = idx;
        }
    }
    return idxInArr;
}

function getRandKeyFromCountSet(countSet) {
    var keys = Object.keys(countSet);
    if (keys.length === 0) return false;
    else {
        var letters = [];
        for (var ki = 0; ki < keys.length; ki++) {
            for (var li = 0; li < countSet[keys[ki]]; li++) {
                letters.push(keys[ki]);
            }
        }
        var letter = letters[Math.floor(letters.length * Math.random())];
        if (countSet[letter] === 1) {
            delete countSet[letter];
        } else {
            countSet[letter] -= 1;
        }
        return letter;
    }
}

function getWordFromLineDefn(mainLine, tilePlacements, tiles, rack) {
    var placedIds = tilePlacements.map(function(placement) {
        return placement[0];
    });
    var word = '';
    var points = 0;
    var wordMult = 1;
    var varyingIdx = mainLine[0][mainLine[2]];
    while (varyingIdx <= mainLine[1][mainLine[2]]) {
        var coords = mainLine[0];
        coords[mainLine[2]] = varyingIdx;
        var tileId = coords[0]+15*coords[1];
        var placeIdx = placedIds.indexOf(tileId);
        if (placeIdx === -1 && tiles[tileId].letter === false) {
            return [false, 0];
        } else if (placeIdx !== -1) {
            var letter = tilePlacements[placeIdx][1];
            word += letter;
            var letterPts = LETTER_PTS[letter.toLowerCase()];
            if (tiles[tileId].mult < 10) {
                points += tiles[tileId].mult*letterPts;
            } else {
                points += letterPts;
                wordMult *= tiles[tileId].mult - 10;
            }
        } else if (tiles[tileId].letter !== false) {
            //multipliers only work on tiles they've placed
            var letter = tiles[tileId].letter;
            word += letter;
            points += LETTER_PTS[letter.toLowerCase()];
        }
        varyingIdx++;
    }
    return [word.toUpperCase(), points*wordMult];
}

function getLinesFrom(placements, tiles, longAxis) {
    var minMaxCoords = placements.reduce(function(ret, coords, idx) {
        if (idx === 0) return [coords, coords];
        var newMin = ret[0][longAxis] < coords[longAxis] ? ret[0] : coords;
        var newMax = ret[1][longAxis] > coords[longAxis] ? ret[1] : coords;
        return [newMin, newMax];
    }, []);

    var minCoords = minMaxCoords[0].slice(0);
    for (var firstIdx = minCoords[longAxis]-1; firstIdx >= 0; firstIdx--) {
        var tileId = firstIdx + 15*minCoords[1-longAxis];
        if (longAxis === 1) {
            tileId = 15*firstIdx + minCoords[1-longAxis];
        }
        if (tiles[tileId].letter === false) break;
    }
    firstIdx += 1;

    var maxCoords = minMaxCoords[1].slice(0);
    for (var lastIdx = maxCoords[longAxis]+1; lastIdx < 15; lastIdx++) {
        var tileId = lastIdx + 15*maxCoords[1-longAxis];
        if (longAxis === 1) {
            tileId = 15*lastIdx + maxCoords[1-longAxis];
        }
        if (tiles[tileId].letter === false) break;
    }
    lastIdx -= 1;

    var firstCoords = minCoords;
    firstCoords[longAxis] = firstIdx;
    var lastCoords = maxCoords;
    lastCoords[longAxis] = lastIdx;

    return [
        firstCoords,
        lastCoords,
        longAxis
    ];
}
