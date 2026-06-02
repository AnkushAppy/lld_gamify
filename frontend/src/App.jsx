import { useEffect, useState } from "react";
import { fetchSystems, startGame } from "./api.js";
import Dashboard from "./components/Dashboard.jsx";
import GameScreen from "./components/GameScreen.jsx";

export default function App() {
  const [tracks, setTracks] = useState([]);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSystems()
      .then(setTracks)
      .catch(() =>
        setError("Failed to load tracks. Is the API running on port 8000?"),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSelectTrack(systemId) {
    setLoading(true);
    setError("");
    try {
      const gameConfig = await startGame(systemId);
      setConfig(gameConfig);
      setSelectedSystemId(systemId);
    } catch {
      setError("Failed to load quiz config for selected track.");
    } finally {
      setLoading(false);
    }
  }

  function handleQuit() {
    setSelectedSystemId(null);
    setConfig(null);
  }

  if (selectedSystemId && config) {
    return (
      <GameScreen
        systemId={selectedSystemId}
        config={config}
        onQuit={handleQuit}
      />
    );
  }

  return (
    <Dashboard
      tracks={tracks}
      onSelect={handleSelectTrack}
      loading={loading}
      error={error}
    />
  );
}
