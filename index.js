require('dotenv').config();
const { App, LogLevel } = require('@slack/bolt');
const { extractUserIdFromEscapedFormat } = require('./util');
const Game = require('./game-response-store');
const game = new Game();

const app = new App({
  token: process.env.BOT_TOKEN,
  signingSecret: process.env.SIGNING_SECRET,
  logLevel: LogLevel.DEBUG
});

const helpResponse = {
  text: 'Usage: /rps @user',
  response_type: 'ephemeral'
};

const emojiMap = {
  rock: ':fist:',
  paper: ':raised_back_of_hand:',
  scissors: ':v:'
};

const nameMap = {
  rock: 'Rock',
  paper: 'Paper',
  scissors: 'Scissors'
};

const getNewGameBlock = (challengingUser, competingUser, tie = false) => {
  const gameId = game.startNewGame(challengingUser, competingUser);
  return {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: tie ? 'That was a tie. Let\'s try that again.' : `<@${challengingUser}> wants to play a game of rock-paper-scissors with <@${competingUser}>`
        }
      },
      {
        type: 'actions',
        block_id: gameId,
        elements: ['rock', 'paper', 'scissors'].map((action) => ({
          type: 'button',
          text: {
            type: 'plain_text',
            emoji: true,
            text: `${nameMap[action]} ${emojiMap[action]}`
          },
          action_id: action
        }))
      }
    ]
  }
};

const handleRpsStart = async({text: inputText, user_id: challengingUser}) => {
  const text = inputText.split(' ').filter((t) => t.length > 0);
  if (text.length !== 1) {
    return helpResponse;
  }
  const competingUser = extractUserIdFromEscapedFormat(text[0]);
  if (!competingUser) {
    return helpResponse;
  }
  if (challengingUser === competingUser) {
    return {
      text: 'You cannot play rock-paper-scissors with yourself',
      response_type: 'ephemeral'
    }
  }
  return {
    ...getNewGameBlock(challengingUser, competingUser),
    response_type: 'in_channel'
  };
};

app.command('/rps', async ({ command, ack, respond }) => {
  try {
    await ack();
    await respond(await handleRpsStart(command));
  } catch(error) {
    console.error(JSON.stringify(error, undefined, 2));
  }
});

const handleGameResponse = ({game_id, user_id, action_id}) => {
  if(!game.isValidGame(game_id)){
    return {
      text: 'Oops. RPS had an issue :cry:\nPlease start a new game.'
    }
  }
  if(game.storeGameResponse(game_id, user_id, action_id)) {
    if (game.bothResponsesReceived(game_id)) {
      const winner = game.getWinner(game_id);
      if (winner === 'tie') {
        const [user1, user2] = game.getGameUsers(game_id);
        game.removeGame(game_id);
        return {
          ...getNewGameBlock(user1, user2, true),
          replace_original: true,
          response_type: 'in_channel'
        };
      } else {
        const [loser] = game.getGameUsers(game_id).filter((user) => user !== winner);
        const text = `<@${winner}> ${emojiMap[game.getUserResponse(game_id, winner)]} beats ${emojiMap[game.getUserResponse(game_id, loser)]} <@${loser}>`
        game.removeGame(game_id);
        return {
          text,
          replace_original: true,
          response_type: 'in_channel'
        }
      }
    }
  }
};

app.action(/rock|paper|scissors/, async ({ ack, respond ,payload: { block_id: game_id, action_id }, body: { user: { id: user_id}}}) => {
  try {
    await ack();
    const response = handleGameResponse({game_id, user_id, action_id});
    return response && respond(response);
  } catch(error) {
    console.error(JSON.stringify(error, undefined, 2));
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('RPS is running!');
})();
