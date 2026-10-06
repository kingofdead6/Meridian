import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import authRouter from './auth.js';
import uploadsRouter from './uploads.js';
import { companyRouter, usersRouter, auditRouter, directoryRouter } from './company.js';
import { contactsRouter, productsRouter, warehousesRouter, inventoryRouter } from './catalog.js';
import { ordersRouter, invoicesRouter, paymentsRouter } from './documents.js';
import { accountsRouter, journalRouter, reportsRouter } from './accounting.js';
import {
  leadsRouter, departmentsRouter, employeesRouter, leavesRouter, payrollRouter, projectsRouter, tasksRouter,
} from './people.js';
import { dashboardRouter, searchRouter, assistantRouter } from './misc.js';

const router = Router();

router.use('/auth', authRouter);
router.use(protect);

router.use('/company', companyRouter);
router.use('/users', usersRouter);
router.use('/directory', directoryRouter);
router.use('/audit', auditRouter);
router.use('/uploads', uploadsRouter);

router.use('/contacts', contactsRouter);
router.use('/products', productsRouter);
router.use('/warehouses', warehousesRouter);
router.use('/inventory', inventoryRouter);

router.use('/orders', ordersRouter);
router.use('/invoices', invoicesRouter);
router.use('/payments', paymentsRouter);

router.use('/accounts', accountsRouter);
router.use('/journal', journalRouter);
router.use('/reports', reportsRouter);

router.use('/leads', leadsRouter);
router.use('/departments', departmentsRouter);
router.use('/employees', employeesRouter);
router.use('/leaves', leavesRouter);
router.use('/payroll', payrollRouter);
router.use('/projects', projectsRouter);
router.use('/tasks', tasksRouter);

router.use('/dashboard', dashboardRouter);
router.use('/search', searchRouter);
router.use('/assistant', assistantRouter);

export default router;
