const handleSensitivityChange = async (e) => {
    const newVal = e.target.value;
    setSettings({...settings, sensitivity: newVal});

    // Send to backend for real-time responsiveness
    await fetch('http://localhost:8000/settings/sensitivity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: newVal })
    });
};

// In your JSX:
<input 
    type="range" 
    value={settings.sensitivity}
    onChange={handleSensitivityChange}
    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500" 
/>