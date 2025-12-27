describe('Complete User Journey', () => {
  const user1 = { username: 'alice', email: 'alice@e2e.com', password: 'pass123' };
  const user2 = { username: 'bob', email: 'bob@e2e.com', password: 'pass123' };

  beforeEach(() => {
    // Use configured baseUrl so tests run against different environments
    cy.visit('/');
  });

  it('completes full chat flow', () => {
    // Register user 1
    cy.contains('Create Account').click();
    cy.get('input[placeholder*="Username"]').type(user1.username);
    cy.get('input[placeholder*="Email"]').type(user1.email);
    cy.get('input[placeholder*="Password"]').type(user1.password);
    cy.contains('button', 'Register').click();
    
    cy.contains(user1.username).should('be.visible');
    cy.contains('Logout').click();
    
    // Register user 2
    cy.contains('Create Account').click();
    cy.get('input[placeholder*="Username"]').type(user2.username);
    cy.get('input[placeholder*="Email"]').type(user2.email);
    cy.get('input[placeholder*="Password"]').type(user2.password);
    cy.contains('button', 'Register').click();
    
    // Start chat with user 1
    cy.contains(user1.username).click();
    
    // Send message
    cy.get('input[placeholder*="Type a message"]').type('Hello Alice!');
    cy.contains('button', 'Send').click();
    cy.contains('Hello Alice!').should('be.visible');
    
    // Add reaction
    cy.contains('Hello Alice!').parent().find('button').contains('👍').click();
    
    // Upload file
    cy.get('input[type="file"]').selectFile('cypress/fixtures/test.txt', { force: true });
    cy.contains('Upload').click();
    cy.contains('test.txt').should('be.visible');
    
    // Search messages
    cy.get('input[placeholder*="Search"]').type('Hello');
    cy.contains('Hello Alice!').should('be.visible');
    
    // Toggle dark mode
    cy.get('[aria-label*="dark mode"]').click();
    cy.get('body').should('have.class', 'dark-mode');
  });

  it('handles typing indicators', () => {
    cy.contains('Login').click();
    cy.get('input[placeholder*="Email"]').type(user1.email);
    cy.get('input[placeholder*="Password"]').type(user1.password);
    cy.contains('button', 'Login').click();
    
    cy.contains(user2.username).click();
    cy.get('input[placeholder*="Type a message"]').type('T');
    cy.contains('typing').should('be.visible');
  });

  it('shows online status', () => {
    cy.contains('Login').click();
    cy.get('input[placeholder*="Email"]').type(user1.email);
    cy.get('input[placeholder*="Password"]').type(user1.password);
    cy.contains('button', 'Login').click();
    
    cy.get('.online-indicator').should('exist');
  });
});
