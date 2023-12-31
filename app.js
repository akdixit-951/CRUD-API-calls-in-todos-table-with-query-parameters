/* 
 * Created a table with name todo in the todoApplication.db file using the CLI
 * 
 * SQL command
    CREATE TABLE todo(id INTEGER, todo TEXT, priority TEXT, status TEXT);
    INSERT INTO todo(id, todo, priority, status)
    VALUES (1, "Learn HTML", "HIGH", "TO DO"),
    (2, "Learn JS", "MEDIUM", "IN PROGRESS"),
    (3, "Learn CSS", "LOW", "DONE"),
    (4, "Play Chess", "LOW", "DONE");
    SELECT * FROM todo;
*/

const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

// Get Books API with query parameters
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      todo LIKE '%${search_q}%' AND
      status = '${status}' AND
      priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
    SELECT 
      * 
    FROM
      todo
    WHERE
      todo LIKE '%${search_q}%'
      AND priority = '${priority}'`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
    SELECT 
      * 
    FROM
      todo
    WHERE
      todo LIKE '%${search_q}%' AND
      status = '${status}'`;
      break;
    default:
      getTodosQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
    todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getTodosQuery);
  response.send(data);
});

//Get Todo based on todoId API
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(todo);
});

//Post Todo API
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const addTodoQuery = `INSERT INTO
      todo (id, todo, priority, status)
    VALUES
      (${id}, '${todo}', '${priority}', '${status}');`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});

//Put Todo API
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const getPreviousTodoQuery = `SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;

  const previousTodo = await db.get(getPreviousTodoQuery);
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo = '${todo}',
      priority = '${priority}',
      status = '${status}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//Delete Todo API
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
