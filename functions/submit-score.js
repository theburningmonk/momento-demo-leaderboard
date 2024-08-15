const { submitScore } = require('../lib/momento');
/**
 * 
 * @param {import('aws-lambda').APIGatewayProxyEvent} event 
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
module.exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const leaderboardName = event.pathParameters['leaderboard'];
  const name = event.pathParameters['name'];

  try {
    await submitScore(leaderboardName, name, body.score);

    return {
      statusCode: 202,
    };
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify('Failed to submit score')
    };
  }
};
