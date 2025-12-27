// Custom commands for chat app testing

Cypress.Commands.add('login', (email = 'test@example.com') => {
  cy.visit('/');
  cy.get('[data-cy=email-input]').type(email);
  cy.get('[data-cy=login-btn]').click();
  cy.get('[data-cy=chat-app]').should('be.visible');
});

Cypress.Commands.add('createPrivateChat', (userName) => {
  cy.get('[data-cy=contact-item]').contains(userName).click();
  cy.get('[data-cy=chat-header]').should('contain', userName);
});

Cypress.Commands.add('sendMessage', (message) => {
  cy.get('[data-cy=message-input]').type(message);
  cy.get('[data-cy=send-btn]').click();
  cy.get('[data-cy=message-bubble]').should('contain', message);
});

Cypress.Commands.add('waitForSocket', () => {
  cy.get('[data-cy=connection-status]').should('contain', 'Online');
});