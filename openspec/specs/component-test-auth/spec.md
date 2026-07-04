# Auth Component Tests Specification

## Purpose

Behavioral test coverage for authentication components (LoginPage, ProtectedRoute). Specs define observable behavior: renders, form validation, store integration, redirects, error handling.

## Requirements

### Requirement: LoginPage Store Name

LoginPage SHALL render the store name from storeConfig, falling back to "La Tiendita".

#### Scenario: Store name from config

- GIVEN storeConfig has name "Mi Tienda"
- WHEN LoginPage renders
- THEN "Mi Tienda" is visible

#### Scenario: Fallback store name

- GIVEN storeConfig has no name
- WHEN LoginPage renders
- THEN "La Tiendita" is visible

### Requirement: LoginPage Form Validation

LoginPage SHALL require username and password before allowing submission.

#### Scenario: Empty username shows error

- GIVEN username field is empty
- WHEN user submits the form
- THEN a validation error for username is shown
- AND `login()` is not called

#### Scenario: Empty password shows error

- GIVEN password field is empty
- WHEN user submits the form
- THEN a validation error for password is shown
- AND `login()` is not called

#### Scenario: Both fields valid enables submit

- GIVEN username is "admin" and password is "1234"
- WHEN user submits the form
- THEN `login()` is called with { username: "admin", password: "1234" }

### Requirement: LoginPage Success Flow

LoginPage SHALL navigate to "/" and show a toast on successful login.

#### Scenario: Successful login redirects

- GIVEN login succeeds
- WHEN form is submitted
- THEN toast.success is shown
- AND navigation to "/" occurs

### Requirement: LoginPage Error Handling

LoginPage SHALL show an error toast when login fails.

#### Scenario: Login failure shows error

- GIVEN `login()` throws an error
- WHEN form is submitted
- THEN toast.error is shown
- AND user remains on login page

### Requirement: LoginPage Loading State

LoginPage SHALL show a loading indicator and disable inputs during submission.

#### Scenario: Loading spinner in button

- GIVEN isSubmitting is true
- WHEN LoginPage renders
- THEN button shows spinner and "Iniciando sesión..."
- AND username/password inputs are disabled

### Requirement: LoginPage Error Banner

LoginPage SHALL display an error message from authStore when present.

#### Scenario: Auth error displayed

- GIVEN authStore.error is "Credenciales inválidas"
- WHEN LoginPage renders
- THEN error banner with that text is visible

### Requirement: LoginPage Auth Redirect

LoginPage SHALL redirect to "/" when user is already authenticated.

#### Scenario: Authenticated user redirected

- GIVEN isAuthenticated is true
- WHEN LoginPage renders
- THEN navigation to "/" occurs

### Requirement: LoginPage Password Toggle

LoginPage SHALL provide a button to toggle password visibility.

#### Scenario: Toggle shows password

- GIVEN password field type is "password"
- WHEN user clicks toggle
- THEN password field type becomes "text"

#### Scenario: Toggle hides password

- GIVEN password field type is "text"
- WHEN user clicks toggle
- THEN password field type becomes "password"

### Requirement: LoginPage Error Cleanup

LoginPage SHALL clear authStore error on unmount.

#### Scenario: Error cleared on unmount

- GIVEN authStore.error is set
- WHEN LoginPage unmounts
- THEN authStore.clearError is called

### Requirement: ProtectedRoute Unauthenticated

ProtectedRoute SHALL redirect to /login when user is not authenticated.

#### Scenario: Redirect to login

- GIVEN isAuthenticated is false
- WHEN ProtectedRoute renders
- THEN Navigate to="/login" with replace is rendered
- AND children/Outlet are not rendered

### Requirement: ProtectedRoute Authenticated

ProtectedRoute SHALL render children or Outlet when user is authenticated.

#### Scenario: Render children

- GIVEN isAuthenticated is true and children exist
- WHEN ProtectedRoute renders
- THEN children are rendered

#### Scenario: Render Outlet

- GIVEN isAuthenticated is true and no children
- WHEN ProtectedRoute renders
- THEN Outlet is rendered
