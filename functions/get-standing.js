const { getScoreAndRank } = require('../lib/momento');

/**
 * 
 * @param {import('aws-lambda').APIGatewayProxyEvent} event 
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
module.exports.handler = async (event) => {
  const leaderboardName = event.pathParameters['leaderboard'];
  const name = event.pathParameters['name'];

  try {
    const result = await getScoreAndRank(leaderboardName, name);
    return {
      statusCode: 200,
      body: JSON.stringify({
        score: result.score,
        rank: result.rank
      })
    };
  // eslint-disable-next-line no-unused-vars
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify('Failed to get score and rank')
    };
  }
};
