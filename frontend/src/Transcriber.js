import React, { useState, useEffect } from "react";
import FileSaver from 'file-saver';
import './Transcriber.css'; // Import the CSS file

const Transcriber = () => {
    const [file, setFile] = useState(null);
    const [mediaURL, setMediaURL] = useState(null);
    const [transcription] = useState([]);
    const [translation] = useState([]);
    const [models] = useState(["base", "large", "tiny"]);  // Static list of models
    const [selectedModel, setSelectedModel] = useState("base");
    const [exportFormat, setExportFormat] = useState("txt");

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        setFile(uploadedFile);

        // Create a URL to preview the uploaded file
        const url = URL.createObjectURL(uploadedFile);
        setMediaURL(url);
    };

    const exportFile = (content, format) => {
        let blob;
        const filename = `exported_file.${format}`;

        if (format === 'txt') {
            const textContent = content.map(seg => `Time [${formatTime(seg.start)} - ${formatTime(seg.end)}]: ${seg.text}`).join("\n");
            blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
        } else if (format === 'json') {
            blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json;charset=utf-8" });
        } else if (format === 'srt') {
            const srtContent = content.map((seg, index) => 
                `${index + 1}\n${formatTime(seg.start, true)} --> ${formatTime(seg.end, true)}\n${seg.text}\n`
            ).join("\n");
            blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
        } else if (format === 'vtt') {
            const vttContent = "WEBVTT\n\n" + content.map(seg => 
                `${formatTime(seg.start, true)} --> ${formatTime(seg.end, true)}\n${seg.text}\n`
            ).join("\n");
            blob = new Blob([vttContent], { type: "text/vtt;charset=utf-8" });
        }

        FileSaver.saveAs(blob, filename);
    };

    const formatTime = (time, forSubtitle = false) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = (time % 60).toFixed(2);
        if (forSubtitle) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(5, '0').replace('.', ',')}`;
        }
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(5, '0')}`;
    };

    return (
        <div className="container">
            <p className="sample-label">This is a sample page with no backend functionality.</p>
            <label htmlFor="file-upload" className="upload-label">Upload File</label>
            <input id="file-upload" type="file" accept="audio/*,video/*" onChange={handleFileChange} className="file-input" />

            {mediaURL && (
                <div className="media-preview">
                    <h3>Preview</h3>
                    {file && file.type.startsWith("video") ? (
                        <video controls src={mediaURL} />
                    ) : (
                        <audio controls src={mediaURL} />
                    )}
                </div>
            )}

            <div className="controls">
                <div className="select-group">
                    <label>Model: </label>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                        {models.map((model) => (
                            <option key={model} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="action-buttons">
                <button disabled>Transcribe</button>
                <button disabled>Translate</button>
            </div>

            <div className="export">
                <label>Export as: </label>
                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                    <option value="txt">TXT</option>
                    <option value="json">JSON</option>
                    <option value="srt">SRT</option>
                    <option value="vtt">VTT</option>
                </select>
                <button disabled>Export</button>
            </div>
        </div>
    );
};

export default Transcriber;
