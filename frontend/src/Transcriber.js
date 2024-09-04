import React, { useState, useEffect } from "react";
import axios from "axios";
import FileSaver from 'file-saver';
import './Transcriber.css'; // Import the CSS file

const Transcriber = () => {
    const [file, setFile] = useState(null);
    const [mediaURL, setMediaURL] = useState(null);
    const [transcription, setTranscription] = useState([]);
    const [translation, setTranslation] = useState([]);
    const [inputLanguage, setInputLanguage] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("en");
    const [models, setModels] = useState([]);  // Dynamic list of models
    const [selectedModel, setSelectedModel] = useState("");
    const [detectedLanguage, setDetectedLanguage] = useState("");
    const [loading, setLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState("txt");
    const [startTime, setStartTime] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [processingComplete, setProcessingComplete] = useState(false);

    // Fetch available models on component mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await axios.get("http://localhost:8000/models/");
                setModels(response.data.models);
                setSelectedModel(response.data.models[0] || "");  // Set default model
            } catch (error) {
                console.error("Error fetching models:", error);
            }
        };
        fetchModels();
    }, []);

    useEffect(() => {
        let timer;
        if (loading && startTime) {
            timer = setInterval(() => {
                setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            }, 1000);
        } else {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [loading, startTime]);

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        setFile(uploadedFile);

        // Create a URL to preview the uploaded file
        const url = URL.createObjectURL(uploadedFile);
        setMediaURL(url);
    };

    const handleTranscribe = async () => {
        if (!file) {
            alert("Please upload a file before transcribing.");
            return;
        }
        setLoading(true);
        setProcessingComplete(false);
        setStartTime(Date.now());
        setTranscription([]);
        setTranslation([]);
        setDetectedLanguage("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("selected_model", selectedModel);  // Changed from model_name to selected_model
        formData.append("language", inputLanguage);

        try {
            const response = await axios.post("http://localhost:8000/transcribe/", formData);
            setTranscription(response.data.transcription);
            setDetectedLanguage(response.data.detected_language);
        } catch (error) {
            console.error("Error during transcription:", error);
            alert("An error occurred during transcription.");
        } finally {
            setLoading(false);
            setProcessingComplete(true);
            setStartTime(null);
        }
    };

    const handleTranslate = async () => {
        if (!file) {
            alert("Please upload a file before translating.");
            return;
        }
        setLoading(true);
        setProcessingComplete(false);
        setStartTime(Date.now());
        setTranscription([]);
        setTranslation([]);
        setDetectedLanguage("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("selected_model", selectedModel);  // Changed from model_name to selected_model
        formData.append("source_language", inputLanguage);
        formData.append("target_language", targetLanguage);

        try {
            const response = await axios.post("http://localhost:8000/translate/", formData);
            setTranslation(response.data.translation);
            setDetectedLanguage(response.data.detected_language);
        } catch (error) {
            console.error("Error during translation:", error);
            alert("An error occurred during translation.");
        } finally {
            setLoading(false);
            setProcessingComplete(true);
            setStartTime(null);
        }
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
        const minutes = Math.floor(time / 60);
        const seconds = (time % 60).toFixed(2);
        if (forSubtitle) {
            return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(5, '0').replace('.', ',')}`;
        }
        return `${minutes}:${String(seconds).padStart(5, '0')}`;
    };

    return (
        <div className="container">
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

                <div className="input-group">
                    <label>Input Language: </label>
                    <input
                        type="text"
                        placeholder="Optional (e.g., 'en')"
                        value={inputLanguage}
                        onChange={(e) => setInputLanguage(e.target.value)}
                    />
                </div>
            </div>

            <div className="action-buttons">
                <button onClick={handleTranscribe} disabled={loading}>Transcribe</button>
                <button onClick={handleTranslate} disabled={loading}>Translate</button>
            </div>

            {loading && (
                <div className="loading">
                    Processing... Time elapsed: {elapsedTime} seconds
                </div>
            )}

            {processingComplete && (
                <div className="processing-time">
                    <h3>Total Processing Time: {elapsedTime} seconds</h3>
                </div>
            )}

            {processingComplete && transcription.length > 0 && (
                <div className="result">
                    <h3>Transcription:</h3>
                    <table className="result-table">
                        <thead>
                            <tr>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Text</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transcription.map((segment, index) => (
                                <tr key={index}>
                                    <td>{formatTime(segment.start)}</td>
                                    <td>{formatTime(segment.end)}</td>
                                    <td>{segment.text}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {processingComplete && translation.length > 0 && (
                <div className="result">
                    <h3>Translation:</h3>
                    <table className="result-table">
                        <thead>
                            <tr>
                                <th>Start Time</th>
                                <th>End Time</th>
                                <th>Text</th>
                            </tr>
                        </thead>
                        <tbody>
                            {translation.map((segment, index) => (
                                <tr key={index}>
                                    <td>{formatTime(segment.start)}</td>
                                    <td>{formatTime(segment.end)}</td>
                                    <td>{segment.text}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {processingComplete && (transcription.length > 0 || translation.length > 0) && (
                <div className="export">
                    <label>Export as: </label>
                    <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
                        <option value="txt">TXT</option>
                        <option value="json">JSON</option>
                        <option value="srt">SRT</option>
                        <option value="vtt">VTT</option>
                    </select>
                    <button onClick={() => exportFile(transcription.length > 0 ? transcription : translation, exportFormat)}>Export</button>
                </div>
            )}
        </div>
    );
};

export default Transcriber;
