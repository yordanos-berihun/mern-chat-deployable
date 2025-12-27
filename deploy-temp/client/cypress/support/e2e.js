import './commands';

// Disable uncaught exception handling for tests
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});

beforeEach(() => {
  // Clear localStorage before each test
  cy.clearLocalStorage();
});