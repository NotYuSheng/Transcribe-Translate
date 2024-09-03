import React, { useState } from "react";
import axios from "axios";
import FileSaver from 'file-saver';

const Transcriber = () => {
    const [file, setFile] = useState(null);
    const [mediaURL, setMediaURL] = useState(null);
    const [transcription, setTranscription] = useState([]);
    const [translation, setTranslation] = useState([]);
    const [inputLanguage, setInputLanguage] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("en");
    const [model, setModel] = useState("base");
    const [detectedLanguage, setDetectedLanguage] = useState("");
    const [loading, setLoading] = useState(false);
    const [exportFormat, setExportFormat] = useState("txt");

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        setFile(uploadedFile);

        // Create a URL to preview the uploaded file
        const url = URL.createObjectURL(uploadedFile);
        setMediaURL(url);
    };

    const handleTranscribe = async () => {
        setLoading(true);
        setTranscription([]);
        setTranslation([]);
        setDetectedLanguage("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("model_name", model);
        formData.append("language", inputLanguage);

        const response = await axios.post("http://localhost:8000/transcribe/", formData);
        setTranscription(response.data.transcription);
        setDetectedLanguage(response.data.detected_language);
        setLoading(false);
    };

    const handleTranslate = async () => {
        setLoading(true);
        setTranscription([]);
        setTranslation([]);
        setDetectedLanguage("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("model_name", model);
        formData.append("source_language", inputLanguage);
        formData.append("target_language", targetLanguage);

        const response = await axios.post("http://localhost:8000/translate/", formData);
        setTranslation(response.data.translation);
        setDetectedLanguage(response.data.detected_language);
        setLoading(false);
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
        <div>
            <h2>Upload Audio or Video</h2>
            <input type="file" accept="audio/*,video/*" onChange={handleFileChange} />

            {mediaURL && (
                <div>
                    <h3>Preview</h3>
                    {file && file.type.startsWith("video") ? (
                        <video controls src={mediaURL} width="600" />
                    ) : (
                        <audio controls src={mediaURL} />
                    )}
                </div>
            )}

            <div>
                <label>Model: </label>
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                    <option value="base">Base</option>
                    <option value="large">Large</option>
                    <option value="base.en">Base.en</option>
                </select>
            </div>

            <div>
                <label>Input Language: </label>
                <input
                    type="text"
                    placeholder="Optional (e.g., 'en')"
                    value={inputLanguage}
                    onChange={(e) => setInputLanguage(e.target.value)}
                />
            </div>

            <div>
                <button onClick={handleTranscribe} disabled={loading}>Transcribe</button>
                <button onClick={handleTranslate} disabled={loading}>Translate</button>
            </div>

            {loading && (
                <div className="loading">Processing...</div>
            )}

            {detectedLanguage && (
                <div>
                    <h3>Detected Language: {detectedLanguage}</h3>
                </div>
            )}

            <div>
                <h3>Transcription:</h3>
                <table>
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

            <div>
                <h3>Translation:</h3>
                <table>
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

            {(transcription.length > 0 || translation.length > 0) && (
                <div>
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