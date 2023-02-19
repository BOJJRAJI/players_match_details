const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const dbpath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1 GET players

app.get("/players/", async (request, response) => {
  const getPlyersDetailsQuery = `
    SELECT * FROM player_details;`;

  const playersDetails = await db.all(getPlyersDetailsQuery);

  function convertIntoCamelCase(dbObject) {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  }

  response.send(
    playersDetails.map((playerDetails) => convertIntoCamelCase(playerDetails))
  );
});

//API 2 get player details

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlyerDetailsQuery = `
    SELECT * FROM player_details WHERE player_id=${playerId};`;

  const playerDetails = await db.get(getPlyerDetailsQuery);

  function convertIntoCamelCase(dbObject) {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  }

  response.send(convertIntoCamelCase(playerDetails));
});

//API 3
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;

  const updatePlayerDetails = `
  UPDATE player_details  SET player_name=${playerName}
  WHERE player_id = ${playerId};`;

  await db.run(updatePlayerDetails);

  response.send("Player Details Updated");
});

//API4

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchDetailsQuery = `
    SELECT * FROM match_details WHERE match_id=${matchId};`;

  const matchDetails = await db.get(getMatchDetailsQuery);

  console.log(matchDetails);

  function convertIntoCamelCase(dbObject) {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    };
  }

  response.send(convertIntoCamelCase(matchDetails));
});

//API5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getMatchDetailsQuery = `
   SELECT * FROM player_match_score NATURAL JOIN  match_details 
   WHERE player_id=${playerId};`;

  const playerMatches = await db.all(getMatchDetailsQuery);

  function convertIntoCamelCase(dbObject) {
    return {
      matchId: dbObject.match_id,
      match: dbObject.match,
      year: dbObject.year,
    };
  }

  response.send(
    playerMatches.map((playerMatch) => convertIntoCamelCase(playerMatch))
  );
});

//API6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerDetailsQuery = `
  SELECT * FROM player_match_score NATURAL JOIN player_details 
   WHERE match_id=${matchId};
 `;
  const playersDetails = await db.all(getPlayerDetailsQuery);

  function convertIntoCamelCase(dbObject) {
    return {
      playerId: dbObject.player_id,
      playerName: dbObject.player_name,
    };
  }

  response.send(
    playersDetails.map((playerDetails) => convertIntoCamelCase(playerDetails))
  );
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchDetails = `
    SELECT 
    player_details.player_id as playerId,
    player_details.player_name as playerName,
    SUM(player_match_score.score) as totalScore,
    SUM(fours) as totalFours,
    SUM(sixes) as totalSixes FROM 
    player_details INNER JOIN 
    player_match_score ON player_details.player_id = player_match_score.player_id WHERE 
    player_details.player_id=${playerId};`;
  const matchDetails = await db.get(getPlayerMatchDetails);
  response.send(matchDetails);
});

module.exports = app;
