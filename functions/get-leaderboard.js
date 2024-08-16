const { initClient, getLeaderboard } = require('../lib/momento');
const middy = require('@middy/core');
const ssm = require('@middy/ssm');

/**
 * 
 * @param {import('aws-lambda').APIGatewayProxyEvent} event 
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
module.exports.handler = middy(async (event, context) => {
  const leaderboardName = event.pathParameters['leaderboard'];
  const startRank = parseInt(event.queryStringParameters['startRank']) || undefined;
  const endRank = parseInt(event.queryStringParameters['endRank']) || undefined;

  try {
    await initClient(context.MOMENTO_API_KEY);
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
}).use(ssm({
  cache: true,
  cacheExpiry: 5 * 60 * 1000,
  setToContext: true,
  fetchData: {
    MOMENTO_API_KEY: process.env.MOMENTO_API_KEY_PARAM_NAME
  }
}));
