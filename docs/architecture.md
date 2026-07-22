# Architecture Overview

The `pi-token-speed` extension follows a modular architecture inspired by the Laravel framework, organized by concern rather than by technical type. This separation ensures that the core engine logic, configuration management, and user interface remain decoupled, making the codebase easier to test, maintain, and extend.

## Directory Structure

- **`Core/`**: The heart of the extension. Contains the primary logic for token processing, sliding window calculations, and event management.
    - `engine.ts`: The central processing unit.
    - `events.ts`: Orchestrates events between the engine and the renderer.
    - `sliding-window.ts`: Handles time-based token accumulation.
- **`UI/`**: Responsible for all output and visualization.
    - `renderer.ts`: Handles terminal output, color logic, and display mode formatting.
- **`Config/`**: Manages the environment, settings, and default values.
    - `settings.ts`: Implements a factory pattern to provide isolated configuration instances.
    - `options.ts`: Defines the configuration schema.
- **`Commands/`**: Contains the executable logic for user actions.
    - `validation.ts`: Validates inputs and configuration.
    - `commands.ts`: The entry point for command execution.
- **`Interfaces/`**: Defines the contracts and types shared across modules.
    - `config-types.ts`: Shared configuration types.
- **`Enums/`**: Centralized enumerations for consistent naming across the codebase.

## Key Design Principles

### 1. Dependency Injection (DI)
The project avoids global state and singletons. Components like the `Engine` and `Renderer` accept their dependencies (like `Settings` or `Validator`) via their constructors or initialization methods. This allows for easy mocking in unit tests.

### 2. Explicit Configuration
Configuration is managed via a Factory Pattern. Instead of a global `settings` object, we use `Settings.create()` to generate a configuration instance. This ensures that multiple instances of the engine can exist with different configurations simultaneously.

### 3. Visibility & Testability
Following a "public-first" philosophy for internal logic, we've minimized the use of `private` modifiers and underscores. This simplifies the testing process by allowing test suites to inspect the internal state of the engine during complex scenarios without needing to expose "hacked" getters.

### 4. Path Aliasing
We use modern ES module path aliases (e.g., `@pi-token-speed/Core`) to ensure that imports are clean and that the folder structure remains flexible without breaking relative import chains.
