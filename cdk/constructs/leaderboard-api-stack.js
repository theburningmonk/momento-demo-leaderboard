const { Stack, Fn, CfnParameter } = require('aws-cdk-lib');
const { Runtime } = require('aws-cdk-lib/aws-lambda');
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs');
const { RestApi, LambdaIntegration } = require('aws-cdk-lib/aws-apigateway')

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

    this.createParameters(props);

    const submitScoreFunction = this.createSubmitScoreFunction();
    const getStandingFunction = this.createGetStandingFunction();
    const getLeaderboardFunction = this.createGetLeaderboardFunction();

    this.createApiEndpoints(props, api, {
      submitScore: submitScoreFunction,
      getStanding: getStandingFunction,
      getLeaderboard: getLeaderboardFunction
    })
  }

  createParameters(props) {
    this.momentoApiKeyParam = new CfnParameter(this, "MomentoApiKeyParameter", {
      type: "AWS::SSM::Parameter::Value<String>",
      default: `/${props.serviceName}/${props.ssmStageName}/momento-api-key`
    })
  }

  createSubmitScoreFunction() {
    const submitScoreFunction = new NodejsFunction(this, 'SubmitScoreFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: 'functions/submit-score.js',  
      memorySize: 1024,
      environment: {
        MOMENTO_API_KEY: Fn.ref(this.momentoApiKeyParam.logicalId),
        MOMENTO_CACHE_NAME
      }
    });

    return submitScoreFunction
  }

  createGetStandingFunction() {
    const getStandingFunction = new NodejsFunction(this, 'GetStandingFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: 'functions/get-standing.js',
      memorySize: 1024,      
      environment: {
        MOMENTO_API_KEY: Fn.ref(this.momentoApiKeyParam.logicalId),
        MOMENTO_CACHE_NAME
      }
    });

    return getStandingFunction
  }

  createGetLeaderboardFunction() {
    const getLeaderboardFunction = new NodejsFunction(this, 'GetLeaderboardFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: 'functions/get-leaderboard.js', 
      memorySize: 1024,     
      environment: {
        MOMENTO_API_KEY: Fn.ref(this.momentoApiKeyParam.logicalId),
        MOMENTO_CACHE_NAME
      }
    });

    return getLeaderboardFunction
  }

  /**
   * 
   * @param {RestApi} api
   */
  createApiEndpoints(props, api, functions) {    
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
