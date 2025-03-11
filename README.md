# Computer Use Extension

A browser extension that provides direct access to ChatGPT Computer Use Agent in your browser. No VM needed.

Brought to you by [dobrowser.io](https://dobrowser.io)

## Demo

https://github.com/user-attachments/assets/5dc7acb0-6e39-4c53-af8d-89209fda5514

## Features

- Let OpenAI's computer use control your browser directly!

## Installing the extension

- **Chrome/Edge**:
  - Download the latest release from [here](https://github.com/SawyerHood/computer-use-extension/releases/)
  - Unzip it
  - Go to `chrome://extensions/`
  - Enable "Developer mode"
  - Click "Load unpacked" and select the unzipped directory

## Development

### Prerequisites

- Modern web browser (Chrome)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Developing the Extension

1. Clone this repository:

   ```
   git clone https://github.com/yourusername/cua-extension.git
   cd cua-extension
   ```

2. Install dependencies:

   ```
   pnpm install
   ```

3. Build the extension:

   ```
   pnpm dev
   ```

4. A browser should appear with the extension installed

## Usage

1. After installation, click the extension icon in your browser toolbar to open the sidebar.
2. On first use, you'll be prompted to enter your OpenAI API key.
3. Start chatting with the AI by typing your message and pressing Enter or clicking Send.
4. Access settings or reset your chat using the buttons in the header.

## Configuration

### API Key

Your OpenAI API key is required to use this extension. It is stored securely in your browser's local storage.

To update your API key:

1. Click the Settings (gear) icon in the extension header
2. Enter your new API key
3. Click Save

## Development

### Project Structure

- `entrypoints/sidepanel/` - Main sidebar interface code
- `components/` - React components for the UI
- Other directories contain extension configuration and utilities

### Development Commands

```
pnpm run dev      # Start development server
pnpm run build    # Build for production
```

## Privacy

This extension requires your OpenAI API key to function. All communication happens directly between your browser and OpenAI's servers. Your conversations and API key are stored locally on your device and are not sent to any third-party servers.

## License

[MIT License](LICENSE)

## Acknowledgments

- Built with React, TypeScript, and OpenAI's API
