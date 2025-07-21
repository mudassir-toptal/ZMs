# Zingage Mini Spreadsheet - Architecture Documentation

## Overview

This is a frontend based mini spreadsheet application built with React and TypeScript. The application demonstrates data dependency management, formula evaluation, and circular reference detection in a spreadsheet-like interface.

## Architecture

### Core Components

1. **SpreadsheetEngine** - Core business logic for spreadsheet operations
2. **FormulaParser** - Handles formula parsing and evaluation
3. **DependencyGraph** - Manages cell dependencies and circular reference detection
4. **React UI Components** - User interface built with React

### Key Features

- **Cell Operations**: Set and get values for cells (A1-J5)
- **Formula Support**: Mathematical formulas with cell references (e.g., =A1+B2)
- **Dependency Tracking**: Automatic recalculation when dependent cells change
- **Circular Reference Detection**: Prevents and reports circular dependencies
- **Data Persistence**: Automatic localStorage persistence
- **Real-time Updates**: Immediate grid updates on changes

### Technical Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: React hooks with custom useSpreadsheet hook
- **Testing**: Jest, React Testing Library, @testing-library/user-event
- **Build Tools**: Vite, TypeScript compiler

## Design Decisions

### 1. Separation of Concerns

The application is structured with clear separation between:

- **Engine Layer**: Pure TypeScript for business logic
- **Hook Layer**: React hooks for state management and side effects
- **Component Layer**: React components for UI rendering

### 2. Dependency Management

Used a custom DependencyGraph to track cell relationships:

- Efficient tracking of dependencies and dependents
- Circular reference detection using depth-first search
- Automatic propagation of changes to dependent cells

### 3. Formula Evaluation

Implemented a custom FormulaParser that:

- Extracts cell references using regex
- Validates formula syntax
- Safely evaluates mathematical expressions
- Handles edge cases like division by zero and non-numeric values

### 4. Error Handling

Comprehensive error handling for:

- Invalid cell references
- Circular dependencies
- Formula syntax errors
- Runtime calculation errors

### 5. Performance Optimizations

- Efficient dependency tracking to minimize recalculations
- Memoized cell value calculations
- Optimized React rendering with proper key usage
- localStorage persistence with debouncing

## Data Flow

1. **User Input** → Component event handlers
2. **Event Handlers** → useSpreadsheet hook
3. **Hook** → SpreadsheetEngine methods
4. **Engine** → FormulaParser and DependencyGraph
5. **Result** → Component re-render with updated data

## Testing Strategy

### Unit Tests

- **SpreadsheetEngine**: Core functionality, formulas, dependencies
- **FormulaParser**: Formula parsing and evaluation
- **DependencyGraph**: Circular reference detection

### Integration Tests

- **Component Integration**: User interactions and data flow
- **End-to-End Scenarios**: Complete user workflows
