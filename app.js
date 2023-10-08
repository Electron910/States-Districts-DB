const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "covid19India.db");
const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const jsonToObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const jsonToObjInDistrict = (dbObj) => {
  return {
    districtId: dbObj.district_id,
    districtName: dbObj.district_name,
    stateId: dbObj.state_id,
    cases: dbObj.cases,
    cured: dbObj.cured,
    active: dbObj.active,
    deaths: dbObj.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT 
    *
    FROM 
    state;
    `;
  const gotStates = await db.all(getStatesQuery);
  response.send(gotStates.map((item) => jsonToObject(item)));
});

//Return based on ID
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getBasedOnID = `
    SELECT 
    *
    FROM state
    WHERE 
    state_id = '${stateId}';
    `;
  const gettingStateOnId = await db.get(getBasedOnID);
  response.send(jsonToObject(gettingStateOnId));
});

//Create a district
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createADistrict = `
    INSERT INTO district(district_name, state_id, cases, cured, active, deaths)
    VALUES(
        '${districtName}',
        '${stateId}',
        '${cases}',
        '${cured}',
        '${active}',
        '${deaths}'
    );
    `;
  const createdDistrict = await db.run(createADistrict);
  response.send("District Successfully Added");
});

//Getting district based on ID
app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictOnIdQuery = `
    SELECT
    *
    FROM district
    WHERE
    district_id = '${districtId}';
    `;
  const gotDistrict = await db.get(getDistrictOnIdQuery);
  response.send(jsonToObjInDistrict(gotDistrict));
});

//Delete based on ID
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteBasedIdQuery = `
    DELETE FROM
    district 
    WHERE 
    district_id = '${districtId}';
    `;
  const deletedDistrict = await db.run(deleteBasedIdQuery);
  response.send("District Removed");
});

//Update existing district
app.put("/districts/:districtId", async (request, response) => {
  const {
    districtId,
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = request.body;
  const updateDistrictOnId = `
    UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}'
    WHERE district_id = '${districtId}';
    `;
  const updatedDistrict = await db.run(updateDistrictOnId);
  response.send("District Details Updated");
});

//Get statistical details of states
app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const statisticsOnStateQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM 
    district
    WHERE 
    state_id = '${stateId}';
    `;
  const statsOfState = await db.get(statisticsOnStateQuery);
  console.log(statsOfState);
  response.send({
    totalCases: statsOfState["SUM(cases)"],
    totalCured: statsOfState["SUM(cured)"],
    totalActive: statsOfState["SUM(active)"],
    totalDeaths: statsOfState["SUM(deaths)"],
  });
});

//Getting state name based on district id
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select * from district
where district_id = ${districtId};
`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = '${getDistrictIdQueryResponse.state_id}';
`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
