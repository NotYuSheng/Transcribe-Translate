import React, { useState } from "react";
import axios from "axios";

const Transcriber = () => {
    const [file, setFile] = useState(null);
    const [result, setResult] = useState("");

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleTranscribe = async () => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post("http://localhost:8000/transcribe/", formData);
        setResult(response.data.transcription);
    };

    const handleTranslate = async () => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await axios.post("http://localhost:8000/translate/", formData, {
            params: { target_language: "en" },
        });
        setResult(response.data.translation);
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} />
            <button onClick={handleTranscribe}>Transcribe</button>
            <button onClick={handleTranslate}>Translate</button>
            <p>{result}</p>
        </div>
    );
};

export default Transcriber;
