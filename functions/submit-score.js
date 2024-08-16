const { initClient, submitScore } = require('../lib/momento');
const middy = require('@middy/core');
const ssm = require('@middy/ssm');

/**
 * 
 * @param {import('aws-lambda').APIGatewayProxyEvent} event 
 * @returns {Promise<import('aws-lambda').APIGatewayProxyResult>}
 */
module.exports.handler = middy(async (event, context) => {
  const body = JSON.parse(event.body);
  const leaderboardName = event.pathParameters['leaderboard'];
  const name = event.pathParameters['name'];

  try {
    await initClient(context.MOMENTO_API_KEY);
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
}).use(ssm({
  cache: true,
  cacheExpiry: 5 * 60 * 1000,
  setToContext: true,
  fetchData: {
    MOMENTO_API_KEY: process.env.MOMENTO_API_KEY_PARAM_NAME
  }
}));
