import logo from './logo.svg';
import './App.css';
import React, { useState } from 'react';
import Transcriber from "./Transcriber";
import MediaPlayer from "./MediaPlayer";

function App() {
    const [fileUrl, setFileUrl] = useState('');
    const [fileName, setFileName] = useState('');

    const handleFileInput = (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setFileUrl(url);
            setFileName(file.name); // Store the file name to display it on the page
        }
    };

    return (
        <div className="App">
            <h1>Whisper Transcriber and Translator</h1>
            <Transcriber />
            <h2>Media Player Example</h2>
            <input type="file" onChange={handleFileInput} accept="video/*,audio/*" />
            {fileName && <p>Now playing: {fileName}</p>} {/* Display the file name */}
            {fileUrl && <MediaPlayer fileUrl={fileUrl} />} {/* Render the MediaPlayer component */}
        </div>
    );
}

export default App;