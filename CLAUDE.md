# Budget Tool - Claude Instructions

## Project Overview
A personal budgeting web app inspired by EveryDollar. Built for personal use with a focus on clean UI and ease of use.

## Tech Stack
- React
- Tailwind CSS
- localStorage for data persistence (no backend)

## Project Structure conventions
- Components go in /src/components
- Keep components small and focused
- Use functional components with hooks

## Code Style
- Clean, readable code with comments where logic is complex
- Consistent naming: PascalCase for components, camelCase for functions/variables

## Key Features (in priority order)
1. Month selector and navigation
2. Budget planning (planned amounts per category)
3. Transaction logging
4. Dashboard with planned vs actual vs remaining
5. Category/subcategory management
6. Analytics and charts

## Design Guidelines
- Clean and modern, mobile-friendly
- Sidebar navigation, card-based layouts
- Color coding: green = on track, yellow = nearing limit, red = over budget
- Inspiration: EveryDollar, Mint

## Notes for Claude
- Always commit-ready code, no half-finished components
- When adding a new feature, update this file if anything changes about the architecture
- Prefer simplicity over complexity
