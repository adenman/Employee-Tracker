INSERT INTO department (name)
VALUES ('Sales'),
( 'Finance'),
( 'Legal'),
( 'Service');

INSERT INTO role (title, salary, department_id)
VALUES ('Sales person', 30000, 1),
( 'financial advisor', 70000, 2),
( 'lawyer', 120000, 3),
( 'doorman', 20000, 4);


INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('Aden', 'Neal',1,3),
( 'Abigail', 'Powless',2,NULL),
( 'Benjamin', 'Biddle',3,4),
( 'Rachel', 'Neal',4,4);


