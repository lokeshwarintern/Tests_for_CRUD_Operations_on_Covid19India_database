const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertToResponseObj = (dbObj) => {
  return {
    stateId: dbObj.state_id,
    stateName: dbObj.state_name,
    population: dbObj.population,
  };
};
const convertToDistrictResponseObj = (dbObj) => {
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
// const convertingDbObj = (dbResponse) => {
//   return {
//     totalCases: dbResponse.cases,
//     totalCured: dbResponse.cured,
//     totalActive: dbResponse.active,
//     totalDeaths: dbResponse.deaths,
//   };
// };
//GET (Returns a list of all states in the state table)
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
        SELECT
            *
        FROM
            state;

    
    `;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((eachItem) => convertToResponseObj(eachItem)));
});

//GET(Returns a state based on the state ID)
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getQuery = `
        SELECT
            *
        FROM
            state
        WHERE
            state_id = ${stateId};
    
    `;
  const dbResponse = await db.get(getQuery);
  response.send(convertToResponseObj(dbResponse));
});

//POST(Create a district in the district table)
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const createDistrictQuery = `
            INSERT INTO
                district(district_name,state_id,cases,cured,active,deaths)
            VALUES (
                '${districtName}',
                ${stateId},
                ${cases},
                ${cured},
                ${active},
                ${deaths}
            );
  
  `;
  await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

//GET (Returns a district based on the district ID)
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
            SELECT 
                *
            FROM
                district
            WHERE
                district_id = ${districtId};
    
    `;
  const dbResponse = await db.get(getDistrictQuery);
  response.send(convertToDistrictResponseObj(dbResponse));
});

//DELETE (Deletes a district from the district table based on the district ID)
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistQuery = `
            DELETE FROM
                district
            WHERE
                district_id = ${districtId};

    
    `;
  await db.run(deleteDistQuery);
  response.send("District Removed");
});

//PUT(Updates the details of a specific district based on the district ID)
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;

  const updateDistQuery = `
            UPDATE
                district
            SET
                district_name = '${districtName}',
                state_id = '${stateId}',
                cases = ${cases},
                cured = ${cured},
                active = ${active},
                deaths = ${deaths}
            WHERE
                district_id = ${districtId}
    
    `;
  await db.run(updateDistQuery);
  response.send("District Details Updated");
});

//GET(Returns the statistics of total cases, cured, active, deaths of a specific state based on state ID)
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
            SELECT 
                SUM(cases) AS totalCases,
                SUM(cured) AS totalCured,
                SUM(active) AS totalActive,
                SUM(deaths) AS totalDeaths
            FROM
                district
            WHERE
                state_id = ${stateId};
    
    `;

  const dbResponse = await db.get(getStatsQuery);
  response.send(dbResponse);
});

//GET(Returns an object containing the state name of a district based on the district ID)
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
            SELECT
                state_id
            FROM
                district
            WHERE
                district_id = ${districtId};
    `;
  const stateIdObj = await db.get(getStateIdQuery);

  const getStateNameQuery = `
            SELECT
                state_name AS stateName
            FROM
                state
            WHERE
                state_id = ${stateIdObj.state_id};
    `;
  const dbResponse = await db.get(getStateNameQuery);
  response.send(dbResponse);
});

module.exports = app;
