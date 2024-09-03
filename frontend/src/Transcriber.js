import React, { useState } from "react";
import axios from "axios";

const Transcriber = () => {
    const [file, setFile] = useState(null);
    const [mediaURL, setMediaURL] = useState(null);
    const [transcription, setTranscription] = useState("");
    const [translation, setTranslation] = useState("");
    const [inputLanguage, setInputLanguage] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("en");
    const [model, setModel] = useState("base");

    const handleFileChange = (e) => {
        const uploadedFile = e.target.files[0];
        setFile(uploadedFile);

        // Create a URL to preview the uploaded file
        const url = URL.createObjectURL(uploadedFile);
        setMediaURL(url);
    };

    const handleTranscribe = async () => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model_name", model);
        formData.append("language", inputLanguage);

        const response = await axios.post("http://backend:8000/transcribe/", formData);
        setTranscription(response.data.transcription);
    };

    const handleTranslate = async () => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model_name", model);
        formData.append("source_language", inputLanguage);
        formData.append("target_language", targetLanguage);

        const response = await axios.post("http://backend:8000/translate/", formData);
        setTranslation(response.data.translation);
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
                    <option value="large-v3">Large-v3</option>
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
                <button onClick={handleTranscribe}>Transcribe</button>
            </div>

            <div>
                <label>Target Language: </label>
                <input
                    type="text"
                    placeholder="e.g., 'en'"
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                />
                <button onClick={handleTranslate}>Translate</button>
            </div>

            <div>
                <h3>Transcription:</h3>
                <pre>{JSON.stringify(transcription, null, 2)}</pre>
            </div>

            <div>
                <h3>Translation:</h3>
                <pre>{JSON.stringify(translation, null, 2)}</pre>
            </div>
        </div>
    );
};

export default Transcriber;