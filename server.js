const express = require('express');
const { Pool } = require('pg');
const inquirer = require('inquirer');
const Table = require('cli-table3');

const PORT = process.env.PORT || 3001;
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  password: 'abc',
  host: 'localhost',
  database: 'employee_db'
});

pool.connect()
  .then(() => console.log('Connected to the employee_db database!'))
  .catch(err => console.error('Database connection error:', err.stack));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startPrompts();
});

function startPrompts() {
  inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View All Employees',
        'Add Employee',
        'Update Employee Role',
        'View All Roles',
        'Add Role',
        'View Departments',
        'Add Department'
      ]
    }
  ]).then(answers => {
    switch (answers.action) {
      case 'View All Employees':
        viewEmployees();
        break;
      case 'Add Employee':
        addEmployee();
        break;
      case 'Update Employee Role':
        updateRoles();
        break;
      case 'View All Roles':
        viewRoles();
        break;
      case 'Add Role':
        addRole();
        break;
      case 'View Departments':
        viewDepartments();
        break;
      case 'Add Department':
        addDepartment();
        break;
    }
  }).catch(error => {
    console.error('Error with Inquirer prompt:', error);
  });
}

function viewEmployees() {
  const query = `
    SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, m.first_name AS manager
    FROM employee e
    JOIN role r ON e.role_id = r.id
    JOIN department d ON r.department_id = d.id
    LEFT JOIN employee m ON e.manager_id = m.id
  `;

  pool.query(query)
    .then(result => {
      const table = new Table({
        head: ['ID', 'First Name', 'Last Name', 'Title', 'Department', 'Salary', 'Manager'],
        colWidths: [10, 20, 20, 20, 20, 15, 20]
      });

      result.rows.forEach(employee => {
        table.push([
          employee.id,
          employee.first_name,
          employee.last_name,
          employee.title,
          employee.department,
          employee.salary,
          employee.manager || 'N/A'
        ]);
      });

      console.log(table.toString());
      startPrompts();
    })
    .catch(err => {
      console.error('Query error:', err.stack);
    });
}

function addEmployee() {
  Promise.all([
    pool.query('SELECT * FROM role'),
    pool.query('SELECT * FROM employee')
  ])
  .then(([roleResult, employeeResult]) => {
    const roleChoices = roleResult.rows.map(role => ({
      name: role.title,
      value: role.id
    }));

    const managerChoices = employeeResult.rows.map(employee => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id
    }));

    inquirer.prompt([
      { type: 'input', name: 'first_name', message: 'Enter the First name:' },
      { type: 'input', name: 'last_name', message: 'Enter the Last name:' },
      { type: 'list', name: 'role', message: 'Select a Role:', choices: roleChoices },
      { type: 'list', name: 'manager', message: 'Select a Manager:', choices: managerChoices }
    ]).then(answers => {
      const { first_name, last_name, role, manager } = answers;

      const query = 'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)';
      pool.query(query, [first_name, last_name, role, manager])
        .then(() => {
          console.log('Employee added successfully!');
          startPrompts();
        })
        .catch(err => console.error('Query error:', err.stack));
    }).catch(error => {
      console.error('Error with Inquirer prompt:', error);
    });
  })
  .catch(err => {
    console.error('Query error fetching roles or employees:', err.stack);
  });
}

function updateRoles() {
  Promise.all([
    pool.query('SELECT * FROM employee'),
    pool.query('SELECT * FROM role')
  ])
  .then(([employeeResult, roleResult]) => {
    const employeeChoices = employeeResult.rows.map(employee => ({
      name: `${employee.first_name} ${employee.last_name}`,
      value: employee.id
    }));

    const roleChoices = roleResult.rows.map(role => ({
      name: role.title,
      value: role.id
    }));

    inquirer.prompt([
      { type: 'list', name: 'employee', message: 'Select an employee to update:', choices: employeeChoices },
      { type: 'list', name: 'newRole', message: 'Select the new role for the employee:', choices: roleChoices }
    ]).then(answers => {
      const { employee, newRole } = answers;

      const query = 'UPDATE employee SET role_id = $1 WHERE id = $2';
      pool.query(query, [newRole, employee])
        .then(() => {
          console.log('Employee role updated successfully!');
          startPrompts();
        })
        .catch(err => console.error('Query error during update:', err.stack));
    }).catch(error => {
      console.error('Error with Inquirer prompt:', error);
    });
  })
  .catch(err => {
    console.error('Query error fetching employees or roles:', err.stack);
  });
}

function addDepartment() {
  inquirer.prompt([
    { type: 'input', name: 'department', message: 'Enter the Department name:' }
  ]).then(answers => {
    const { department } = answers;

    pool.query('SELECT * FROM department WHERE name = $1', [department])
      .then(result => {
        if (result.rows.length > 0) {
          console.log('Department already exists.');
          startPrompts();
        } else {
          pool.query('INSERT INTO department (name) VALUES ($1)', [department])
            .then(() => {
              console.log('Department added successfully!');
              startPrompts();
            })
            .catch(err => {
              console.error('Query error:', err.stack);
            });
        }
      })
      .catch(err => {
        console.error('Query error:', err.stack);
      });
  }).catch(error => {
    console.error('Error with Inquirer prompt:', error);
  });
}

function viewDepartments() {
  const query = 'SELECT * FROM department';
  pool.query(query)
    .then(result => {
      const table = new Table({
        head: ['ID', 'Name'],
        colWidths: [10, 30]
      });

      result.rows.forEach(department => {
        table.push([
          department.id,
          department.name
        ]);
      });

      console.log(table.toString());
      startPrompts();
    })
    .catch(err => {
      console.error('Query error:', err.stack);
    });
}

function viewRoles() {
  pool.query(`
    SELECT r.id, r.title, d.name AS department, r.salary 
    FROM role r
    LEFT JOIN department d ON r.department_id = d.id
  `)
  .then(result => {
    const table = new Table({
      head: ['ID', 'Title', 'Department', 'Salary'],
      colWidths: [10, 30, 30, 15]
    });

    result.rows.forEach(role => {
      table.push([
        role.id,
        role.title,
        role.department || 'N/A',
        role.salary
      ]);
    });

    console.log(table.toString());
    startPrompts();
  })
  .catch(err => {
    console.error('Query error:', err.stack);
  });
}

function addRole() {
  pool.query('SELECT * FROM department')
    .then(result => {
      const departmentChoices = result.rows.map(department => ({
        name: department.name,
        value: department.id
      }));

      inquirer.prompt([
        { type: 'input', name: 'role', message: 'Enter the role name:' },
        { type: 'input', name: 'salary', message: 'Enter the salary of the role:' },
        { type: 'list', name: 'department', message: 'Select a department:', choices: departmentChoices }
      ]).then(answers => {
        const { role, salary, department } = answers;

        pool.query('SELECT * FROM role WHERE title = $1', [role])
          .then(result => {
            if (result.rows.length > 0) {
              console.log('Role already exists.');
              startPrompts();
            } else {
              pool.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, $3)', [role, salary, department])
                .then(() => {
                  console.log('Role added successfully!');
                  startPrompts();
                })
                .catch(err => {
                  console.error('Query error:', err.stack);
                });
            }
          })
          .catch(err => {
            console.error('Query error:', err.stack);
          });
      }).catch(error => {
        console.error('Error with Inquirer prompt:', error);
      });
    })
    .catch(err => {
      console.error('Query error fetching departments:', err.stack);
    });
}
