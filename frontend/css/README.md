# CSS Structure Documentation

This directory contains the organized CSS files for the FoodExpress frontend application.

## File Structure

### `styles.css`
Main CSS file that imports all other CSS files. This is the only CSS file that should be linked in HTML files.

### `base.css`
Contains fundamental styles:
- CSS reset and base styles
- CSS custom properties (variables)
- Utility classes
- Message notifications
- Section headers
- Page headers
- Breadcrumb navigation

### `components.css`
Contains reusable UI components:
- Button styles (primary, outline, cart, large, full)
- Form styles (inputs, textareas, labels)
- Modal styles (auth, cart, checkout)
- Card styles (basic cards, images, content)
- Badge styles (primary, success, warning)
- Loading states and skeleton loaders

### `layout.css`
Contains layout and structural styles:
- Navigation bar and menu
- Grid systems (2-column, 3-column, 4-column)
- Responsive design breakpoints
- Page layouts (main content, page content)
- Footer layout and styling
- Cart layout (2-column with sticky summary)
- Orders layout

### `pages.css`
Contains page-specific styles:
- Hero section with animations
- Categories section and cards
- Items section and cards
- Reviews section and cards
- Cart page specific styles
- Orders page specific styles
- Responsive adjustments for pages

## Color Scheme

The application uses a modern blue and green color palette:

- **Primary Blue**: `#2563eb` - Main brand color
- **Secondary Blue**: `#1d4ed8` - Darker blue for gradients
- **Accent Green**: `#10b981` - Success and accent color
- **Success Green**: `#059669` - Darker green
- **Warning**: `#f59e0b` - Warning states
- **Error**: `#dc2626` - Error states

## Grid Layouts

### Categories Grid
- 2 items per row (45% width each)
- Responsive: 1 column on mobile

### Items Grid
- 3 items per row (33% width each)
- Responsive: 1 column on mobile

### Reviews Grid
- Auto-fit with minimum 300px width
- Responsive: adjusts automatically

## Usage

To use these styles in your HTML files, simply link the main `styles.css` file:

```html
<link rel="stylesheet" href="css/styles.css">
```

The main file will automatically import all the separated CSS files.

## Benefits of This Structure

1. **Maintainability**: Each file has a specific purpose, making it easier to find and modify styles
2. **Organization**: Related styles are grouped together
3. **Scalability**: Easy to add new components or pages without cluttering existing files
4. **Performance**: CSS is still loaded as one file, maintaining performance
5. **Collaboration**: Multiple developers can work on different CSS files simultaneously

## Adding New Styles

When adding new styles:

1. **Base styles** → Add to `base.css`
2. **Reusable components** → Add to `components.css`
3. **Layout and structure** → Add to `layout.css`
4. **Page-specific styles** → Add to `pages.css`

## Responsive Design

The application uses a mobile-first approach with breakpoints:
- **Mobile**: Up to 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px and above

All components and layouts are responsive and will adapt to different screen sizes. 