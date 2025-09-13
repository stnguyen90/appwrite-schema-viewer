# Appwrite Schema Viewer

A web application that converts JSON schema definitions into Mermaid Entity-Relationship Diagrams (ERD), specifically designed for Appwrite database schemas.

## Features

- 🔄 Real-time conversion of JSON to Mermaid ERD
- 🌗 Dark/Light theme support
- 🔍 Interactive diagram viewing with:
  - Pan and zoom controls
  - Reset view option
  - Zoom percentage display
- 📂 Multiple view modes:
  - Diagram view with interactive controls
  - Source code view with Mermaid syntax
- 📥 Export options:
  - Download as SVG in diagram mode
  - Download as Mermaid (.mmd) in source mode
  - Copy to clipboard functionality
- 🗃️ Database filtering:
  - Filter tables by database
  - Support for multiple databases
  - Clear database selection UI

## Built With

- Next.js
- React
- TypeScript
- Tailwind CSS
- Mermaid.js
- shadcn/ui components
- Lucide Icons

## Getting Started

### Prerequisites

- Node.js
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
   ```bash
   git clone [repository-url]
   cd appwrite-schema-viewer
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### JSON Structure

The application expects a JSON configuration with the following structure:

```json
{
  "tablesDB": [
    {
      "$id": "database1",
      "name": "Database 1",
      "enabled": true
    }
  ],
  "tables": [
    {
      "$id": "table1",
      "name": "Users",
      "databaseId": "database1",
      "columns": [
        {
          "key": "email",
          "type": "string",
          "required": true,
          "encrypt": false
        },
        {
          "key": "posts",
          "type": "relationship",
          "relatedTable": "table2",
          "relationType": "oneToMany",
          "side": "parent",
          "onDelete": "cascade",
          "twoWay": true
        }
      ]
    }
  ]
}
```

### Features

1. **Database Selection**
   - Use the database dropdown to filter tables by database
   - Each database's tables and relationships will be shown in isolation

2. **View Modes**
   - Toggle between Diagram and Source views using the buttons in the header
   - Diagram view shows the interactive ERD
   - Source view shows the raw Mermaid syntax

3. **Interactive Controls**
   - Pan: Click and drag the diagram
   - Zoom: Use the + and - buttons or scroll wheel
   - Reset: Click the Reset button to return to the original view

4. **Export Options**
   - Download SVG: In diagram mode, downloads the current diagram as an SVG file
   - Download Source: In source mode, downloads the Mermaid syntax as a .mmd file
   - Copy: Copies the current view's content to clipboard

### Mermaid ERD Features

The generated diagrams include:

- Entity boxes with field definitions
- System fields (id, sequence, timestamps, permissions)
- Relationship lines with:
  - Cardinality indicators
  - Delete behavior (cascade)
  - Two-way relationship markers
  - Relationship names

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - See [LICENSE](LICENSE) file for details