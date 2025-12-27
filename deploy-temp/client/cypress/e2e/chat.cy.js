describe('Chat Functionality', () => {
  beforeEach(() => {
    cy.login('alice@example.com');
    cy.waitForSocket();
  });

  it('should display chat interface', () => {
    cy.get('[data-cy=sidebar]').should('be.visible');
    cy.get('[data-cy=chats-list]').should('be.visible');
    cy.get('[data-cy=contacts-section]').should('be.visible');
  });

  it('should create private chat', () => {
    cy.createPrivateChat('Bob Smith');
    cy.get('[data-cy=messages-area]').should('be.visible');
    cy.get('[data-cy=input-area]').should('be.visible');
  });

  it('should send and receive messages', () => {
    cy.createPrivateChat('Bob Smith');
    
    const message = 'Hello from Cypress test!';
    cy.sendMessage(message);
    
    cy.get('[data-cy=message-bubble]').should('contain', message);
    cy.get('[data-cy=message-status]').should('be.visible');
  });

  it('should show unread message count', () => {
    cy.createPrivateChat('Bob Smith');
    cy.sendMessage('Test message');
    
    // Switch to another chat
    cy.get('[data-cy=chat-item]').first().click();
    
    // Should show unread count
    cy.get('[data-cy=unread-count]').should('be.visible');
  });

  it('should search chats', () => {
    cy.get('[data-cy=search-input]').type('Bob');
    cy.get('[data-cy=contact-item]').should('contain', 'Bob');
  });

  it('should work on mobile viewport', () => {
    cy.viewport('iphone-x');
    
    cy.get('[data-cy=menu-btn]').click();
    cy.get('[data-cy=sidebar]').should('have.class', 'open');
    
    cy.createPrivateChat('Bob Smith');
    cy.get('[data-cy=sidebar]').should('not.have.class', 'open');
  });
});