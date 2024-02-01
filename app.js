const express = require("express");
const app = express();
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

app.use(express.json());
const initializeDb = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error:${e.message}`);
    process.exit(1);
  }
};
initializeDb();
//API1
const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasStatusAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.status !== undefined && requestQuery.priority !== undefined
  );
};
app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority } = request.query;
  let getTodosQuery = "";
  switch (true) {
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM TODO
            WHERE todo LIKE '%${search_q}%' AND status='${status}'`;

      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE
            todo LIKE '%${search_q}%' AND priority='${priority}'`;
      break;
    case hasStatusAndPriorityProperties(request.query):
      getTodosQuery = `
            SELECT * FROM todo WHERE
            todo LIKE '%${search_q}%' AND priority='${priority}' AND status='${status}'`;
      break;
    default:
      getTodosQuery = `
            SELECT * FROM todo WHERE
            todo LIKE '%${search_q}%' `;
  }
  const getTodos = await db.all(getTodosQuery);
  response.send(getTodos);
});
//API2
const convertTodoDb = (objectItem) => {
  return {
    id: objectItem.id,
    todo: objectItem.todo,
    priority: objectItem.priority,
    status: objectItem.status,
  };
};
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT * FROM todo WHERE id=${todoId}`;
  const getTodo = await db.get(getTodoQuery);
  response.send(convertTodoDb(getTodo));
});
//API3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const addTodoQuery = `
    INSERT INTO todo(id,todo,priority,status)
    VALUES(${id},'${todo}','${priority}','${status}')`;
  await db.run(addTodoQuery);
  response.send("Todo Successfully Added");
});
//API4
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
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;
  const updateTodoQuery = `
  UPDATE todo
  SET todo='${todo}',status='${status}',priority='${priority}'
  WHERE id=${todoId}`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});
//API5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
  DELETE FROM todo
  WHERE id=${todoId}`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});
module.exports = app;
