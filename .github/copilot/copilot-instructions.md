# GitHub Copilot Instructions

## Priority Guidelines

When generating code for this repository:

1. **Version Compatibility**: Always detect and respect the exact versions of languages, frameworks, and libraries used in this project
2. **Context Files**: Prioritize patterns and standards defined in the .github/copilot directory
3. **Codebase Patterns**: When context files don't provide specific guidance, scan the codebase for established patterns
4. **Architectural Consistency**: Maintain the component-based Angular architecture and established boundaries
5. **Code Quality**: Prioritize maintainability, performance, security, accessibility, and testability in all generated code

## Technology Version Detection

Before generating code, scan the codebase to identify:

1. **Language Versions**: TypeScript ~5.9.2 (target ES2022, strict mode)
   - Examine tsconfig.json, tsconfig.app.json, tsconfig.spec.json
   - Never use language features beyond ES2022 / TypeScript 5.9

2. **Framework Versions**: Angular ^21.0.0 (standalone components, SSR)
   - Check package.json: @angular/core ^21.0.0, @angular/router ^21.0.0, @angular/material ^21.0.0, @angular/cdk ^21.0.0
   - @angular/ssr ^21.0.0, @angular/build ^21.0.0
   - Angular CLI ^21.0.0
   - Never suggest features not available in Angular 21

3. **Library Versions**: Note key dependencies
   - Tailwind CSS ^4.1.12 (CSS-first config via @tailwindcss/postcss)
   - RxJS ~7.8.0
   - Express ^5.1.0 (SSR server)
   - Appwrite ^26.1.0 / node-appwrite ^26.2.0
   - Chart.js ^4.5.1, @google/genai ^2.4.0, motion ^12.23.24
   - TypeScript ~5.9.2, Vitest ^4.0.0, ESLint ^9.39.1, angular-eslint 21.1.0
   - Package manager: bun@1.4.2

## Codebase Scanning Instructions

When context files don't provide specific guidance:

1. Identify similar files to the one being modified or created
2. Analyze patterns for:
   - Naming conventions (kebab-case selectors, camelCase properties)
   - Code organization (standalone components in src/app)
   - Error handling
   - Logging approaches
   - Documentation style
   - Testing patterns (Vitest, *.spec.ts)

3. Follow the most consistent patterns found in the codebase
4. Never introduce patterns not found in the existing codebase

## Code Quality Standards

### Maintainability
- Write self-documenting code with clear naming
- Follow the naming and organization conventions evident in the codebase
- Keep functions focused on single responsibilities
- Limit function complexity to match existing patterns

### Performance
- Use ChangeDetectionStrategy.OnPush in components
- Use signals (signal, computed, effect) for reactive state
- Follow existing patterns for SSR (server.ts, main.server.ts)

### Security
- Follow existing patterns for input validation
- Use parameterized queries matching existing patterns
- Handle sensitive data according to existing patterns (dotenv)

### Accessibility
- Follow existing accessibility patterns (angular-eslint templateAccessibility)
- Match ARIA attribute usage with existing components
- Maintain keyboard navigation support consistent with existing code

### Testability
- Follow established patterns for testable code (Vitest)
- Match dependency injection approaches (inject() function)

## Documentation Requirements

- Match the level and style of comments found in existing code
- Document according to patterns observed in the codebase
- Follow existing patterns for documenting non-obvious behavior

## Testing Approach

### Unit Testing
- Match the exact structure and style of existing unit tests (*.spec.ts)
- Follow the same naming conventions for test classes and methods
- Use Vitest as the test runner
- Apply the same mocking approach used in the codebase

## Technology-Specific Guidelines

### Angular 21 Guidelines
- Use standalone components (standalone: true is default in v21, but explicit is fine)
- Use inject() function for dependency injection
- Use signals for state management (signal, computed)
- Use ChangeDetectionStrategy.OnPush
- Component selector: element type, prefix 'app', kebab-case style
- Directive selector: attribute type, prefix 'app', camelCase style
- Follow RxJS patterns from existing code (~7.8.0)
- Use Angular Material components as seen in existing code
- SSR via @angular/ssr with server.ts entry

### TypeScript Guidelines
- Strict mode enabled (strict: true, noImplicitReturns, noFallthroughCasesInSwitch)
- strictInjectionParameters, strictInputAccessModifiers, strictTemplates
- Use target ES2022, module preserve
- Follow import organization patterns from existing code

### Tailwind CSS 4 Guidelines
- CSS-first configuration (no tailwind.config.js; use @theme in CSS)
- Use @tailwindcss/postcss plugin
- Follow utility class patterns from existing components

### Appwrite Guidelines
- Follow existing patterns in src/lib/appwrite.ts and src/app/appwrite.ts
- Use Appwrite SDK ^26.1.0 for client, node-appwrite ^26.2.0 for server

## General Best Practices

- Follow naming conventions exactly as they appear in existing code
- Match code organization patterns from similar files (all components in src/app)
- Apply error handling consistent with existing patterns
- Match logging patterns from existing code
- Use bun as the package manager

## Project-Specific Guidance

- Scan the codebase thoroughly before generating any code
- Respect existing architectural boundaries without exception
- Match the style and patterns of surrounding code
- When in doubt, prioritize consistency with existing code over external best practices
- All components are standalone and live in src/app/
- Server-side code lives in src/server/
- Shared utilities in src/lib/
