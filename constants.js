// A one-stop-shop to hide your hideous constant variables!!

const welcome = `
  ______                 _                       
 |  ____|               | |                      
 | |__   _ __ ___  _ __ | | ___  _   _  ___  ___ 
 |  __| | '_ ' _ \\| '_ \\| |/ _ \\| | | |/ _ \\/ _ \\
 | |____| | | | | | |_) | | (_) | |_| |  __/  __/
 |______|_| |_| |_| .__/|_|\\___/ \\__, |\\___|\\___|
 |__   __|        | || |          __/ |          
    | |_ __ __ _  |_|| | _____ _ |___/           
    | | '__/ _' |/ __| |/ / _ \\ '__|             
    | | | | (_| | (__|   <  __/ |                
    |_|_|  \\__,_|\\___|_|\\_\\___|_|                
                                                  `;

const arrChoices = [
  "View All Employees",
  "Add Employee",
  "Update Employee",
  "View All Roles",
  "Add Role",
  "View All Departments",
  "Add Departments",
  "View employees by manager",
  "View employees by department",
  "View total utilized budget by department",
  "Remove employee",
  "Remove role",
  "Remove department",
  "Quit",
];

const arrPrompts = [
  {
    type: "list",
    message: "What would you like to do?",
    name: "inWait",
    choices: arrChoices,
  },
];

module.exports = { welcome, arrChoices, arrPrompts };
