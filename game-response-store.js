module.exports = class GameResponseStore {
  constructor() {
    this.gameResponses = {};
  }

  startNewGame(user1, user2) {
    const gameId = Math.random().toString(36).substring(7);
    const users = [user1, user2];
    this.gameResponses[gameId] = { users };
    users.forEach((user) => this.gameResponses[gameId][user] = undefined);
    return gameId;
  }

  getGameUsers(gameId) {
    return this.gameResponses[gameId].users;
  }

  getUserResponse(gameId, userId) {
    return this.gameResponses[gameId][userId];
  }

  storeGameResponse(gameId, user, response) {
    if(this.gameResponses[gameId] && this.gameResponses[gameId].users.includes(user) && this.gameResponses[gameId][user] === undefined) {
      this.gameResponses[gameId][user] = response;
      return true;
    }
    return false;
  };

  bothResponsesReceived(gameId) {
    return this.gameResponses[gameId].users.filter((user) => this.gameResponses[gameId][user] !== undefined).length === 2;
  };

  isValidGame(gameId) {
    return !!this.gameResponses[gameId];
  }

  getWinner(gameId) {
    const [user1, user2] = this.gameResponses[gameId].users;
    const user1Response = this.gameResponses[gameId][user1];
    const user2Response = this.gameResponses[gameId][user2];
    if (user1Response === user2Response) {
      return 'tie';
    }
    switch (user1Response) {
      case 'rock':
        return user2Response === 'paper' ? user2 : user1;
      case 'paper':
        return user2Response === 'scissors' ? user2 : user1;
      case 'scissors':
        return user2Response === 'rock' ? user2 : user1;
    }
  }

  removeGame(gameId) {
    delete this.gameResponses[gameId];
  }
}
