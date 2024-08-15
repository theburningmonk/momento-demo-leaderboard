const { getLeaderboard } = require('../lib/momento');

/**
 * 
 * @param {import('aws-lambda').APIGatewayProxyEvent} event 
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
module.exports.handler = async (event) => {
  const leaderboardName = event.pathParameters['leaderboard'];
  const startRank = parseInt(event.queryStringParameters['startRank']) || undefined;
  const endRank = parseInt(event.queryStringParameters['endRank']) || undefined;

  try {
    const leaderboard = await getLeaderboard(leaderboardName, startRank, endRank);
    return {
      statusCode: 200,
      body: JSON.stringify({
        leaderboard: leaderboard
      })
    };
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify('Failed to get leaderboard')
    };
  }
};
