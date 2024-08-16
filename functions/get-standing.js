const { initClient, getScoreAndRank } = require('../lib/momento');
const middy = require('@middy/core');
const ssm = require('@middy/ssm');

/**
 * 
 * @param {import('aws-lambda').APIGatewayProxyEvent} event 
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
module.exports.handler = middy(async (event, context) => {
  const leaderboardName = event.pathParameters['leaderboard'];
  const name = event.pathParameters['name'];

  try {
    await initClient(context.MOMENTO_API_KEY);
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
}).use(ssm({
  cache: true,
  cacheExpiry: 5 * 60 * 1000,
  setToContext: true,
  fetchData: {
    MOMENTO_API_KEY: process.env.MOMENTO_API_KEY_PARAM_NAME
  }
}));
