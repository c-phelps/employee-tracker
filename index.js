const inquirer = require("inquirer");
// retrieve our ugly constants from our constants file
const { welcome, arrChoices, arrPrompts } = require("./constants.js");
// initialize pg
const { Pool } = require("pg");
// set a new instance of the pool with the db credentials
const pool = new Pool({
  user: "postgres",
  password: "Pword1!",
  host: "localhost",
  database: "employees_db",
});
let client;
// first code ran by our app
async function init() {
  // cool welcome image
  console.log(welcome);
  // establish a connection
  // after some reading you can retrieve the client from the pool and assign it to a variable so that the client can be released
  client = await pool.connect();
  // call to the next function
  runInquirer();
}
// our function that we will use recursively to run inquirer
async function runInquirer() {
  const res = await inquirer.prompt(arrPrompts);
  const seclectedIndex = arrChoices.indexOf(res.inWait);
  const query = await switchHandler(seclectedIndex);
  // if the user selected quit this should fire and exit the recursive function call
  if (query === false) {
    console.log("Exiting.");
    // release the client and close the pool
    closeConnections();
    process.exit();
  } else {
    runInquirer();
  }
  // otherwise recursion
}
//
async function closeConnections() {
  if (client) {
    // release client
    client.release();
  }
  // close the pool connection
  await pool.end();
}

// switch function to determine which of the following functions to use based on user input
async function switchHandler(index) {
  switch (index) {
    case 0:
      await selectEmployees();
      return true;
    case 1:
      await insertEmployee();
      return true;
    case 2:
      await updateEmployee();
      return true;
    case 3:
      await selectRoles();
      return true;
    case 4:
      await insertRole();
      return true;
    case 5:
      await selectDepartment();
      return true;
    case 6:
      await insertDepartment();
      return true;
    case 7:
      await selectEmployeesByManager();
      return true;
    case 8:
      await selectEmployeesByDepartment();
      return true;
    case 9:
      await selectBudget();
      return true;
    case 10:
      await deleteEmployee();
      return true;
    case 11:
      await deleteRole();
      return true;
    case 12:
      await deleteDepartment();
      return true;
    // quit was selected
    case 13:
      return false;
  }
}
// handle displaying our employees
async function selectEmployees() {
  const strQuery = `SELECT e.id as id, e.first_name as first_name, e.last_name AS last_name, title, d.name as department, salary, m.first_name || ' ' || m.last_name AS manager
                  FROM employee e
                  LEFT JOIN role r ON e.role_id = r.id
                  LEFT JOIN department d ON r.department = d.id
                  LEFT JOIN employee m ON e.manager_id = m.id;`;
  const { rows } = await client.query(strQuery);
  console.log("\n");
  console.table(rows);
}
// handle our employee insert
async function insertEmployee() {
  const strQuery = await addEmployee();
  await client.query(strQuery);
  console.log("Employee added successfully!");
}
// handle role update for employee
async function updateEmployee() {
  const strQuery = await promptEmployeeUpdate();
  await client.query(strQuery);
  console.log("Employee role updated successfully!");
}
// handle selection of roles
async function selectRoles() {
  const strQuery = `SELECT r.id AS id, title, d.name, salary FROM role r JOIN department d ON r.department = d.id;`;
  const { rows } = await client.query(strQuery);
  console.log("\n");
  console.table(rows);
}
// handle adding a new role
async function insertRole() {
  const strQuery = await addRole();
  await client.query(strQuery);
  console.log("Role added successfully!");
}
// handle selection of all departments
async function selectDepartment() {
  const strQuery = `SELECT * FROM department;`;
  const { rows } = await client.query(strQuery);
  console.log("\n");
  console.table(rows);
}
// handle adding a new department
async function insertDepartment() {
  const strQuery = await addDepartment();
  await client.query(strQuery);
  console.log("Department added successfully!");
}
// handle employee deletion
async function deleteEmployee() {
  const strQuery = await removeEmplyee();
  await client.query(strQuery);
  console.log("Employee removed successfully!");
}
//  handle role deletion
async function deleteRole() {
  const strQuery = await removeRole();
  await client.query(strQuery);
  console.log("Role removed successfully!");
}
// handle department deletion
async function deleteDepartment() {
  const strQuery = await removeDepartment();
  await client.query(strQuery);
  console.log("Department removed successfully!");
}

// function to select employees by manager
async function selectEmployeesByManager() {
  // first select all managers, disntinctly only displaying the name once
  const strQuery = `SELECT DISTINCT m.first_name || ' ' || m.last_name as manager
            FROM employee e
            JOIN employee m ON e.manager_id = m.id;`;
  const data = await pool.query(strQuery);
  // map the data from an array of objects into an array of names
  const arrManagers = data.rows.map((names) => names.manager);
  // prompt the user based on the names
  const res = await inquirer.prompt({
    type: "list",
    message: "Select a manager:",
    name: "inManager",
    choices: arrManagers,
  });
  // send  the name chose to an array of first name last name
  const arrName = res.inManager.split(" ");
  console.log(arrName);
  // query the db where first name = index 0 and last index 1
  const { rows } = await pool.query(
    `SELECT DISTINCT e.first_name || ' ' || e.last_name as employee, m.first_name || ' ' || m.last_name as manager
    FROM employee m
    JOIN employee e ON e.manager_id = m.id WHERE m.first_name = $1 AND m.last_name = $2;`,
    arrName
  );
  // log the resulting table
  console.log("\n");
  console.table(rows);
}
// select budget
async function selectBudget() {
  const strQuery = `SELECT  d.name AS department, SUM(salary) as salary_sum 
  FROM role r 
  JOIN department d ON r.department = d.id 
  JOIN employee e ON e.role_id = r.id
  GROUP BY (d.name);`;
  const { rows } = await client.query(strQuery);
  console.log("\n");
  console.table(rows);
}

// select employees by department
async function selectEmployeesByDepartment() {
  const arrDeptData = await departments();
  const res = await inquirer.prompt({
    type: "list",
    message: "Select a department:",
    name: "inDept",
    choices: arrDeptData,
  });
  const strQuery = `SELECT e.first_name || ' ' || e.last_name AS employee,  d.name AS department
          FROM employee e
          JOIN role r ON e.role_id = r.id
          JOIN department d ON r.department = d.id WHERE d.name = '${res.inDept}';`;
  const { rows } = await client.query(strQuery);
  console.log("\n");
  console.table(rows);
}

//simple function to return an array of departments
const departments = async () => {
  const data = await pool.query(`SELECT name FROM department;`);
  // conver the array of objects into arrays of strings..
  const arrDept = data.rows.map((dept) => dept.name);
  return arrDept;
};
// asyncronous function to prompt the user again within the original inquirer prompt
async function addRole(inCheck, inRole, inDept) {
  const arrDeptData = await departments();
  const arrRoleChoices = [
    { type: "input", message: "What is the name of the role?", name: "inRole" },
    { type: "number", message: "What is the salary of the role?", name: "inSalary" },

    {
      type: "list",
      message: "Which deparmtent does the role belong to?",
      name: "inDepartment",
      choices: arrDeptData,
    },
  ];
  // declaring res outside of the check to see if a valid salary was given
  let res;
  // if its first run then prompt all questions
  if (!inCheck) {
    res = await inquirer.prompt(arrRoleChoices);
    inRole = res.inRole;
    inDept = res.inDepartment;
  } else {
    // if it has failed the NaN check below and is being re-run, prompt only for salary
    res = await inquirer.prompt(arrRoleChoices[1]);
  }
  // check to see if salary is a number, if it is not then recall the function
  // and pass true to inCheck and the values for role and department
  if (isNaN(res.inSalary)) {
    console.log("Invalid salary, please try again.");
    return addRole(true, inRole, inDept);
  }
  // return our SQL query
  const dept = await pool.query(`SELECT id FROM department WHERE name = $1`, [inDept]);
  return `INSERT INTO role(title, salary, department) VALUES ('${inRole}', ${res.inSalary}, ${dept.rows[0].id});`;
}
// query to dynamically fill and return the roles
const roles = async () => {
  const data = await pool.query(`SELECT title FROM role;`);
  const arrRoles = data.rows.map((role) => role.title);
  return arrRoles;
};
// query to concatenate and return the firstnames and lastnames from the employee table
const employees = async () => {
  const data = await pool.query(`SELECT first_name || ' ' || last_name AS name FROM employee;`);
  const arrEmp = data.rows.map((employee) => employee.name);
  return arrEmp;
};
// query builder function to handle prompting for adding new employee
async function addEmployee() {
  const arrRoles = await roles();
  let arrManager = await employees();
  arrManager.unshift("None"); // add the option for the user to have a null manager

  const arrPrompt = [
    { type: "input", message: "What is the first name of the employee?", name: "inFirst" },
    { type: "input", message: "What is the last name of the employee?", name: "inLast" },
    {
      type: "list",
      message: "What is the employee's role?",
      name: "inRole",
      choices: arrRoles,
    },
    {
      type: "list",
      message: "Who is the employee's manager?",
      name: "inManager",
      choices: arrManager,
    },
  ];
  // prompt the user based on our dynamic prompt array
  const res = await inquirer.prompt(arrPrompt);
  // placeholder for empID results or null
  let managerID;
  // updated function to allow for null manager
  if (res.inManager !== "None") {
    // retrieve the manager name into a split array
    const arrName = res.inManager.split(" ");
    const empID = await pool.query(`SELECT id FROM employee WHERE first_name = $1 AND last_name = $2;`, arrName); // pass the split array as an argument to the query
    managerID = empID.rows[0].id;
  } else {
    managerID = null;
  }
  // return our insert statement to the calling function
  const roleID = await pool.query(`SELECT id FROM role WHERE title = $1`, [res.inRole]);
  return `INSERT INTO employee(first_name, last_name, role_id, manager_id) 
          VALUES ('${res.inFirst}','${res.inLast}',${roleID.rows[0].id},${managerID})`;
}
// query builder function for adding a new department
async function addDepartment() {
  const res = await inquirer.prompt({
    type: "input",
    message: "What is the name of the deparment?",
    name: "inDepartment",
  });
  // return our SQL query
  return `INSERT INTO department(name) VALUES ('${res.inDepartment}');`;
}
// return sql string for employee deletion
async function removeEmplyee() {
  const arrEmp = await employees();
  const res = await inquirer.prompt({
    type: "list",
    message: "Select an employee to remove:",
    name: "inName",
    choices: arrEmp,
  });
  return `DELETE FROM employee WHERE first_name || ' ' || last_name = '${res.inName}';`;
}
// retrun sql string to delete roles
async function removeRole() {
  const arrRole = await roles();
  const res = await inquirer.prompt({
    type: "list",
    message: "Select a role to remove:",
    name: "inRole",
    choices: arrRole,
  });
  return `DELETE FROM role WHERE title = '${res.inRole}';`;
}
// return sql string to delete department
async function removeDepartment() {
  const arrDept = await departments();
  const res = await inquirer.prompt({
    type: "list",
    message: "Select a department to delete:",
    name: "inDept",
    choices: arrDept,
  });
  return `DELETE FROM department WHERE name = '${res.inDept}'`;
}
// function for updating the role of a current employee
async function promptEmployeeUpdate() {
  const arrEmp = await employees();
  const arrRoles = await roles();
  // dynamic array of objects for inquirer
  const arrPrompt = [
    {
      type: "list",
      message: "Which employee's role do you want to update?",
      name: "inName",
      choices: arrEmp,
    },
    {
      type: "list",
      message: "Which role do you want to assign the selected employee?",
      name: "inRole",
      choices: arrRoles,
    },
    {
      type: "list",
      message: "Update the employee's manager?",
      name: "inYesNo",
      choices: ["Yes", "No"],
    },
  ];
  // run inquirer
  const res = await inquirer.prompt(arrPrompt);
  // split the name and use if in the where statement for updating
  const arrName = res.inName.split(" ");
  const roleArray = [res.inRole];
  const roleID = await pool.query(`SELECT id FROM role WHERE title = $1`, roleArray);
  // if they do not want to update manager, dont update, otherwise run functionality from addEmployee() to select the manager
  if (res.inYesNo === "No") {
    return `UPDATE employee SET role_id = ${roleID.rows[0].id} WHERE first_name = '${arrName[0]}' AND last_name = '${arrName[1]}';`;
  } else {
    // copied code from above addEmployee()function
    let arrManager = await employees();
    arrManager.unshift("None");
    const res = await inquirer.prompt({
      type: "list",
      message: "Who is the employee's manager?",
      name: "inManager",
      choices: arrManager,
    });
    let managerID;
    // allow for null manager
    if (res.inManager !== "None") {
      // retrieve the manager name into a split array
      const arrManagerName = res.inManager.split(" ");
      const empID = await pool.query(
        `SELECT id FROM employee WHERE first_name = $1 AND last_name = $2;`,
        arrManagerName
      ); // pass the split array as an argument to the query
      managerID = empID.rows[0].id;
    } else {
      managerID = null;
    }
    console.log(managerID);
    console.log(arrName);
    console.log(
      `UPDATE employee SET role_id = ${roleID.rows[0].id}, manager_id = ${managerID} WHERE first_name = '${arrName[0]}' AND last_name = '${arrName[1]}';`
    );
    return `UPDATE employee SET role_id = ${roleID.rows[0].id}, manager_id = ${managerID} WHERE first_name = '${arrName[0]}' AND last_name = '${arrName[1]}';`;
  }
}

// run our code
init();
