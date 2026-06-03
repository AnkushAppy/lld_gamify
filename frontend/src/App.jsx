import { useEffect, useState } from "react";
import { fetchSystems, startGame } from "./api.js";
import CleanCodeGameScreen from "./components/CleanCodeGameScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import HldGameScreen from "./components/HldGameScreen.jsx";
import LldGameScreen from "./components/LldGameScreen.jsx";
import ModeSelector from "./components/ModeSelector.jsx";

export default function App() {
  const [discipline, setDiscipline] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [selectedSystemId, setSelectedSystemId] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!discipline) return undefined;

    setLoading(true);
    setError("");
    fetchSystems(discipline)
      .then(setTracks)
      .catch(() =>
        setError("Failed to load tracks. Is the API running on port 8001?"),
      )
      .finally(() => setLoading(false));
  }, [discipline]);

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

  function handleQuitGame() {
    setSelectedSystemId(null);
    setConfig(null);
  }

  function handleBackToDisciplines() {
    setDiscipline(null);
    setTracks([]);
    setError("");
  }

  if (selectedSystemId && config) {
    if (config.discipline === "hld") {
      return (
        <HldGameScreen
          systemId={selectedSystemId}
          config={config}
          onQuit={handleQuitGame}
        />
      );
    }

    if (config.discipline === "clean_code") {
      return (
        <CleanCodeGameScreen
          systemId={selectedSystemId}
          config={config}
          onQuit={handleQuitGame}
        />
      );
    }

    return (
      <LldGameScreen
        systemId={selectedSystemId}
        config={config}
        onQuit={handleQuitGame}
      />
    );
  }

  if (discipline) {
    return (
      <Dashboard
        discipline={discipline}
        tracks={tracks}
        onSelect={handleSelectTrack}
        onBack={handleBackToDisciplines}
        loading={loading}
        error={error}
      />
    );
  }

  return <ModeSelector onSelect={setDiscipline} />;
}
