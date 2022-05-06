const express = require("express");
const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error ${e.message}`);
  }
};
initializeDBAndServer();

const convertDBDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertDBStateObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
  SELECT *
  FROM state;`;
  const statesArray = await db.all(getStatesQuery);
  response.send(
    statesArray.map((eachState) => convertDBStateObject(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `
  SELECT *
  FROM state
  WHERE state_id=${stateId};`;
  const stateArray = await db.get(getStateQuery);
  response.send(convertDBStateObject(stateArray));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrictQuery = `
  INSERT INTO district (
district_name,
state_id,
cases,
cured,
active,
deaths) VALUES ("${districtName}",${stateId},${cases},${cured},${active},${deaths});`;
  const addDistrict = await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  SELECT *
  FROM district
  WHERE district_id=${districtId};`;
  const districtArray = await db.get(getDistrictQuery);
  response.send(convertDBDistrictObjectToResponseObject(districtArray));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE
  FROM district
  WHERE district_id=${districtId};`;
  const deleteDistrictArray = await db.all(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
  UPDATE district 
SET district_name="${districtName}",
state_id=${stateId},
cases=${cases},
cured=${cured},
active=${active},
deaths=${deaths};
WHERE district_id=${districtId}`;
  const updateDistrict = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getTotalQuery = `
  SELECT SUM(cases),SUM(cured),SUM(active),SUM(deaths) 
  FROM district
  WHERE state_id=${stateId};`;
  const stats = await db.get(getTotalQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getQuery = `
  SELECT state_name 
  FROM district NATURAL JOIN state
  WHERE district_id=${districtId};`;
  const details = await db.get(getQuery);
  response.send({ stateName: details["state_name"] });
});

module.exports = app;
//bharat
