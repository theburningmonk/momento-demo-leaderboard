const { CacheClient, Configurations, CredentialProvider } = require('@gomomento/sdk');
const { 
  CacheSortedSetPutElementResponse,
  CacheSortedSetGetScoreResponse,
  CacheSortedSetGetRankResponse,
  CacheSortedSetFetchResponse,
  SortedSetOrder
} = require('@gomomento/sdk');

const { Logger } = require('@aws-lambda-powertools/logger');
const logger = new Logger({ serviceName: 'leaderboard-api' });

const { MOMENTO_CACHE_NAME } = global.process.env;

let cacheClient;

/**
 * @returns {Promise<CacheClient>}
 */
async function getCacheClient() {
  if (!cacheClient) {
    cacheClient = await CacheClient.create({
      configuration: Configurations.Lambda.latest(),
      credentialProvider: CredentialProvider.fromEnvironmentVariable('MOMENTO_API_KEY'),
      defaultTtlSeconds: 7 * 24 * 60 * 60, // 7 days
    });
  }

  return cacheClient;
};

async function submitScore(leaderboardName, name, score) {
  const cacheClient = await getCacheClient();

  const result = await cacheClient.sortedSetPutElement(
    MOMENTO_CACHE_NAME, leaderboardName, name, score);

  if (result.type === CacheSortedSetPutElementResponse.Error) {    
    logger.error('Failed to submit score', {
      error: result.innerException(),
      errorMessage: result.message()
    });

    throw result.innerException();
  }
}

async function getScore(leaderboardName, name) {
  const cacheClient = await getCacheClient();

  const result = await cacheClient.sortedSetGetScore(
    MOMENTO_CACHE_NAME, leaderboardName, name);

  if (result.type === CacheSortedSetGetScoreResponse.Hit) {
    return result.score();
  } else if (result.type === CacheSortedSetGetScoreResponse.Miss) {
    return 0;
  } else {
    logger.error('Failed to get score', {
      error: result.innerException(),
      errorMessage: result.message()
    });

    throw result.innerException();
  }
}

async function getRank(leaderboardName, name) {
  const cacheClient = await getCacheClient();

  const result = await cacheClient.sortedSetGetRank(
    MOMENTO_CACHE_NAME, leaderboardName, name, {
      order: SortedSetOrder.Descending
    });

  if (result.type === CacheSortedSetGetRankResponse.Hit) {
    return result.rank() + 1;
  } else if (result.type === CacheSortedSetGetRankResponse.Miss) {
    return null;
  } else {
    logger.error('Failed to get rank', {
      error: result.innerException(),
      errorMessage: result.message()
    });

    throw result.innerException();
  }
}

async function getScoreAndRank(leaderboardName, name) {  
  const [score, rank] = await Promise.all([
    getScore(leaderboardName, name),
    getRank(leaderboardName, name),
  ]);

  return { score, rank };
}

async function getLeaderboard(leaderboardName, startRank, endRank) {
  const cacheClient = await getCacheClient();

  const result = await cacheClient.sortedSetFetchByRank(
    MOMENTO_CACHE_NAME, leaderboardName, {
      startRank: startRank || 0, 
      endRank,
      order: SortedSetOrder.Descending
    });

  if (result.type === CacheSortedSetFetchResponse.Hit) {
    return result.value().map((item) => ({
      name: item.value,
      score: item.score
    }));
  } else if (result.type === CacheSortedSetFetchResponse.Miss) {
    return [];
  } else {
    logger.error('Failed to get leaderboard', {
      error: result.innerException(),
      errorMessage: result.message()
    });

    throw result.innerException();
  }
}

module.exports = { 
  submitScore,
  getScoreAndRank,
  getLeaderboard,
};