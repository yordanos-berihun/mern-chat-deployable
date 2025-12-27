describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display login form initially', () => {
    cy.get('[data-cy=auth-form]').should('be.visible');
    cy.get('[data-cy=email-input]').should('be.visible');
    cy.get('[data-cy=login-btn]').should('be.visible');
  });

  it('should login with email', () => {
    cy.get('[data-cy=email-input]').type('alice@example.com');
    cy.get('[data-cy=login-btn]').click();
    
    cy.get('[data-cy=chat-app]').should('be.visible');
    cy.get('[data-cy=user-profile]').should('contain', 'alice');
  });

  it('should register new user', () => {
    cy.get('[data-cy=register-tab]').click();
    cy.get('[data-cy=name-input]').type('New User');
    cy.get('[data-cy=email-input]').type('newuser@example.com');
    cy.get('[data-cy=password-input]').type('password123');
    cy.get('[data-cy=register-btn]').click();
    
    cy.get('[data-cy=chat-app]').should('be.visible');
    cy.get('[data-cy=user-profile]').should('contain', 'New User');
  });

  it('should logout successfully', () => {
    cy.login();
    cy.get('[data-cy=logout-btn]').click();
    cy.get('[data-cy=auth-form]').should('be.visible');
  });
});