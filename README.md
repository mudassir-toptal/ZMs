# Zingage Mini Spreadsheet - Architecture Documentation

## Overview

This is a full-stack mini spreadsheet application built with React and TypeScript. The application demonstrates data dependency management, formula evaluation, and circular reference detection in a spreadsheet-like interface.

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

### AI Disclosure 

I've definitely used AI on calculating and fixing advance calculations of formulas and writing some test cases (although I could write some of the test cases but I've asked AI to generate some of them so that I can fill what I've missed).

### Looms

**Building a Mini Spreadsheet with Formula Functionality 📊**  
https://www.loom.com/share/fb80926a8ff14064b9b45b035c624b48?sid=50d2c9ff-574e-4e4c-a352-84908ddd7981

**Exploring Advanced Functions and Formulas in Spreadsheet Applications**  
https://www.loom.com/share/27c75ad1595f40278ffb8fc3630fcf41?sid=96be6d8a-d642-4870-a9c4-1353952e1a07

**Project Architecture Overview and Component Breakdown 🚀**  
https://www.loom.com/share/9a4b2bc16c724a0fa1a5cb3b443e4443?sid=d0358ba7-c4dc-484d-9352-e71c6fdef2c9

**Testing and Overview of Spreadsheet Engine Functionality**  
https://www.loom.com/share/b750cd774f7b49708ed16e03d6475e6b?sid=e38ade66-fd46-4674-8e59-1bcc50d45bd3
