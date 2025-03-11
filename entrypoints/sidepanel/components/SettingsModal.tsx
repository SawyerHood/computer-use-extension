import { saveApiKey } from "../apiKeyStorage";

interface SettingsModalProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  showApiKeyForm: boolean;
  setShowApiKeyForm: (show: boolean) => void;
  isApiKeySet: boolean;
  setIsApiKeySet: (isSet: boolean) => void;
}

export const SettingsModal = ({
  apiKey,
  setApiKey,
  showApiKeyForm,
  setShowApiKeyForm,
  isApiKeySet,
  setIsApiKeySet,
}: SettingsModalProps) => {
  const handleSaveApiKey = async () => {
    if (apiKey.trim().length > 0) {
      await saveApiKey(apiKey);
      setIsApiKeySet(true);
      setShowApiKeyForm(false);
    }
  };

  if (!showApiKeyForm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-4">OpenAI API Key</h2>
        <p className="mb-4 text-gray-300">
          Please enter your OpenAI API key to use this extension.
        </p>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="sk-..."
        />
        <div className="flex justify-end space-x-2">
          {isApiKeySet && (
            <button
              onClick={() => setShowApiKeyForm(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveApiKey}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
