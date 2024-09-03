import React, { useState } from "react";
import axios from "axios";

const Transcriber = () => {
    const [file, setFile] = useState(null);
    const [transcription, setTranscription] = useState("");
    const [translation, setTranslation] = useState("");
    const [inputLanguage, setInputLanguage] = useState("");
    const [targetLanguage, setTargetLanguage] = useState("en");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleInputLanguageChange = (e) => {
        setInputLanguage(e.target.value);
    };

    const handleTargetLanguageChange = (e) => {
        setTargetLanguage(e.target.value);
    };

    const handleTranscribe = async () => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("language", inputLanguage);

        try {
            const response = await axios.post("http://backend:8000/transcribe/", formData);
            setTranscription(response.data.transcription);
        } catch (error) {
            console.error("There was an error!", error);
        }
    };

    const handleTranslate = async () => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("source_language", inputLanguage);
        formData.append("target_language", targetLanguage);

        const response = await axios.post("http://backend:8000/translate/", formData);
        setTranslation(response.data.translation);
    };

    return (
        <div>
            <h2>Upload Audio or Video</h2>
            <input type="file" accept="audio/*,video/*" onChange={handleFileChange} />
            <div>
                <label>Input Language: </label>
                <input
                    type="text"
                    placeholder="Optional (e.g., 'en')"
                    value={inputLanguage}
                    onChange={handleInputLanguageChange}
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
                    onChange={handleTargetLanguageChange}
                />
                <button onClick={handleTranslate}>Translate</button>
            </div>
            <div>
                <h3>Transcription:</h3>
                <p>{transcription}</p>
            </div>
            <div>
                <h3>Translation:</h3>
                <p>{translation}</p>
            </div>
        </div>
    );
};

export default Transcriber;
