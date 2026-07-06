const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');

// All employee routes require authentication
router.use(authenticateUser);

// Admin / HR routes for creating and deleting employees
router.post('/', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), employeeController.createEmployee);
router.delete('/:id', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), employeeController.deleteEmployee);

// Reading and updating employees
router.get('/', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager', 'Manager', 'Team Lead', 'Finance'), employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById); // Employee can view their own, logic inside controller/frontend can restrict
router.put('/:id', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager', 'Employee'), employeeController.updateEmployee);
router.put('/:id/department', authorizeRoles('Super Admin', 'Organization Admin', 'HR Manager'), employeeController.changeEmployeeDepartment);
router.put('/:id/resume', employeeController.updateEmployeeResume);
router.put('/:id/rate', employeeController.rateEmployee);

module.exports = router;
