const { Stack } = require('aws-cdk-lib');
const { Runtime } = require('aws-cdk-lib/aws-lambda');
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs');
const { RestApi, LambdaIntegration } = require('aws-cdk-lib/aws-apigateway');
const iam = require('aws-cdk-lib/aws-iam');

const MOMENTO_CACHE_NAME = 'leaderboard';

class LeaderboardApiStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const api = new RestApi(this, `${props.stageName}-LeaderboardApi`, {
      deployOptions: {
        stageName: props.stageName,
        tracingEnabled: true
      }
    });

    this.momentoApiKeyParamName = `/${props.serviceName}/${props.ssmStageName}/momento-api-key`;
    this.momentoApiKeyParamArn = `arn:aws:ssm:${this.region}:${this.account}:parameter${this.momentoApiKeyParamName}`;

    const submitScoreFunction = this.createSubmitScoreFunction(props);
    const getStandingFunction = this.createGetStandingFunction(props);
    const getLeaderboardFunction = this.createGetLeaderboardFunction(props);

    this.createApiEndpoints(api, {
      submitScore: submitScoreFunction,
      getStanding: getStandingFunction,
      getLeaderboard: getLeaderboardFunction
    })
  }

  createSubmitScoreFunction(props) {
    return this.createFunction(props, 'submit-score.js', 'SubmitScoreFunction');
  }

  createGetStandingFunction(props) {
    return this.createFunction(props, 'get-standing.js', 'GetStandingFunction');
  }

  createGetLeaderboardFunction(props) {
    return this.createFunction(props, 'get-leaderboard.js', 'GetLeaderboardFunction');
  }

  createFunction(props, filename, logicalId) {
    const func = new NodejsFunction(this, logicalId, {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: `functions/${filename}`,
      memorySize: 1024,
      environment: {
        SERVICE_NAME: props.serviceName,
        STAGE_NAME: props.stageName,
        MOMENTO_API_KEY_PARAM_NAME: this.momentoApiKeyParamName,
        MOMENTO_CACHE_NAME,
        POWERTOOLS_LOG_LEVEL: props.stageName === 'prod' ? 'INFO' : 'DEBUG'
      }
    });

    func.role.attachInlinePolicy(new iam.Policy(this, `${logicalId}SsmPolicy`, {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [ 'ssm:GetParameter*' ],
          resources: [ this.momentoApiKeyParamArn ]
        })
      ]
    }));

    return func;
  }

  /**
   * 
   * @param {RestApi} api
   */
  createApiEndpoints(api, functions) {    
    const leaderboardResource = api.root.addResource('{leaderboard}')
    const nameResource = leaderboardResource.addResource('{name}')

    // POST /{leaderboard}/{name}    
    nameResource.addMethod('POST', new LambdaIntegration(functions.submitScore));

    // GET /{eaderboard}/{name}
    nameResource.addMethod('GET', new LambdaIntegration(functions.getStanding));

    // GET /{leaderboard}?startRank=1&endRank=10
    leaderboardResource.addMethod('GET', new LambdaIntegration(functions.getLeaderboard));
  }
}

module.exports = { LeaderboardApiStack }
