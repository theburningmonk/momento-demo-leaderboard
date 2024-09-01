# momento-demo-leaderboard

Demo of using Momento to build a leaderboard system, using its [Sorted set collection](https://docs.momentohq.com/cache/develop/api-reference/sorted-set-collections).

## To deploy the backend

1. run `npm ci` to restore project dependencies.

2. run `npx cdk deploy` to deploy the application.
*Note: This uses the version of CDK that's installed as dev dependency in the project, so to avoid any version incompatibility with the version of CDK you have installed on your machine.*

After the deployment finishes, you should see something like this:

```
Outputs:
LeaderboardApiStack-dev.devLeaderboardApiEndpointEEE9262B = https://xxx.execute-api.us-east-1.amazonaws.com/dev/
```

Take note of this URL, so you can test the API.

## API Routes

`POST /{leaderboard}/{name}`: submit scores for a user called `{name}` in a leaderboard called `{leaderboard}`. For example, `POST /mario-kart/theburningmonk`.

Example payload:

```json
{
  "score": 42
}
```

`GET /{eaderboard}/{name}`: get the current rank (0-index) and score of a user. For example, `GET /mario-kart/theburningmonk`.

Example response:

```json
{
  "score": 42,
  "rank": 1
}
```

`GET /{leaderboard}?startRank={startRank}&endRank={endRank}`: get the users ranked from `startRank` and `endRank` (0-index).

Example response:

```json
{
  "leaderboard": [
    {
      "name": "v",
      "score": 2077
    },
    {
      "name": "silverhand",
      "score": 34
    }
  ]
}
```
