const inquirer = require("inquirer");
// retrieve our ugly constants from our constants file
const { welcome, arrChoices, arrPrompts, arrRoleChoices } = require("./constants.js");
// initialize pg
const { Pool } = require("pg");
// set a new instance of the pool with the db credentials
const pool = new Pool({
  user: "postgres",
  password: "Pword1!",
  host: "localhost",
  database: "employees_db",
});
// establish a connection
pool.connect();
// first code ran by our app
function init() {
  // cool welcome image
  console.log(welcome);
  // call to the next function
  runInquirer();
}
// our function that we will use recursively to run inquirer
async function runInquirer() {
  const res = await inquirer.prompt(arrPrompts);
  const seclectedIndex = arrChoices.indexOf(res.inWait);
  const query = await handleInput(seclectedIndex);
  // if the user selected quit this should fire and exit the recursive function call
  if (!query) {
    return;
  }
  // otherwise recursion
  runInquirer();
}
// switch function to determine which of the following functions to use based on user input
async function handleInput(index) {
  switch (index) {
    case 0:
      selectEmployees();
      break;
    case 1:
      insertEmployee();
      break;
    case 2:
      updateEmployee();
      break;
    case 3:
      selectRoles();
      break;
    case 4:
      insertRole();
      break;
    case 5:
      selectDepartment();
      break;
    case 6:
      insertDepartment();
      break;
    default:
      return false;
  }
}
// handle displaying our employees
async function selectEmployees() {
  strQuery = `SELECT e.id as id, e.first_name as first_name, e.last_name AS last_name, title, department, salary, m.first_name AS manager
                  FROM employee e
                  LEFT JOIN role r ON e.role_id = r.id
                  LEFT JOIN department d ON r.department = d.id
                  LEFT JOIN employee m ON e.manager_id = m.id;`;

  strData = await pool.query(strQuery);
  console.table(strData);
}
// handle our employee insert
async function insertEmployee() {
  strQuery = await addEmployee();
  await pool.query(strQuery);
  console.log("Employee added successfully!");
}
// handle role update for employee
async function updateEmployee() {
  strQuery = await promptEmployeeUpdate();
  await pool.query(strQuery);
  console.log("Employee role updated successfully!");
}
// handle selection of roles
async function selectRoles() {
  strQuery = `SELECT r.id AS id, title, d.name, salary FROM role r JOIN department d ON r.department = d.id;`;
  strData = await pool.query(strQuery);
  console.table(strData);
}
// handle adding a new role
async function insertRole() {
  strQuery = await addRole();
  await pool.query(strQuery);
  console.log("Role added successfully!");
}
// handle selection of all departments
async function selectDepartment() {
  strQuery = `SELECT * FROM department;`;
  strData = await pool.query(strQuery);
  console.table(strData);
}
// handle adding a new department
async function insertDepartment() {
  strQuery = await addDepartment();
  await pool.query(strQuery);
  console.log("Department added successfully!");
}
// asyncronous function to prompt the user again within the original inquirer prompt
async function addRole() {
  const res = await inquirer.prompt(arrRoleChoices);
  // return our SQL query
  return `INSERT INTO role(title, salary, deparment) VALUES ('${res.inRole}', ${res.inSalary}, '${res.inDepartment}');`;
}
// query to dynamically fill and return the roles
const roles = async () => {
  const data = await pool.query(`SELECT title FROM role;`);
  return data.rows;
};
// query to concatenate and return the firstnames and lastnames from the employee table
const employees = async () => {
  const data = await pool.query(`SELECT first_name || ' ' || last_name AS name FROM employee;`);
  return data.rows;
};
// function to handle prompting for adding new employee
async function addEmployee() {
  // recieve the array of objects from our query ...
  const objRoles = await roles();
  const objManager = await employees();
  // conver the array of objects into arrays of strings..
  const arrRoles = objRoles.map((role) => role.title);
  const arrManager = objManager.map((employee) => employee.name);

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
  // retrieve the manager name into a split array
  const arrName = res.inManager.split(" ");
  const empID = await pool.query(`SELECT id FROM employee WHERE first_name = $1 AND last_name = $2;`, arrName); // pass the split array as an argument to the query
  // return our insert statement to the calling function
  return `INSERT INTO employee(first_name,'last_name',role_id,manager_id) VALUES ('${res.inFirst}','${res.inLast}',${res.inRole},${empID.rows[0].id})`;
}
// function for adding a new department
async function addDepartment() {
  const res = await inquirer.prompt({
    type: "input",
    message: "What is the name of the deparment?",
    name: "inDepartment",
  });
  // return our SQL query
  return `INSERT INTO department( deparment) VALUES ('${res.inDepartment}');`;
}
// function for updating the role of a current employee
async function promptEmployeeUpdate() {
  // copy pasted from employee function above, variables renamed to match current functionality
  const objEmp = await employees();
  const objRoles = await roles();
  // turn our array of objects into an array of strings for both objects
  const arrRoles = objRoles.map((role) => role.title);
  const arrEmp = objEmp.map((employee) => employee.name);
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
  ];
  // run inquirer
  const res = await inquirer.prompt(arrPrompt);
  // split the name and use if in the where statement for updating
  const arrName = res.inName.split(" ");
  return `UPDATE employee SET role = ${res.inRole} WHERE first_name = ${arrName[0]} AND last_name = ${arrName[1]};`;
}

// run our code
init();
