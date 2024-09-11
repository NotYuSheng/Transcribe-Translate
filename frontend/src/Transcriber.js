import React, { useState, useEffect } from "react";
import axios from "axios";
import FileSaver from 'file-saver';
import './Transcriber.css'; // Import the CSS file

const Transcriber = () => {
    const [file, setFile] = useState(null);
    const [mediaURL, setMediaURL] = useState(null);
    const [subtitledMediaURL, setSubtitledMediaURL] = useState(null);
    const [transcription, setTranscription] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processingComplete, setProcessingComplete] = useState(false);
    const [exportFormat, setExportFormat] = useState("srt"); // Default subtitle format
    const [videoWithSubtitles, setVideoWithSubtitles] = useState(null); // Hold video with subtitles
    const [detectedLanguage, setDetectedLanguage] = useState("");

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
        setTranscription([]);
        setDetectedLanguage("");

        const formData = new FormData();
        formData.append("file", file);
        formData.append("model_name", "base");
        formData.append("language", "");

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
        }
    };

    const handleAddSubtitles = async () => {
        if (!file || transcription.length === 0) {
            alert("Please upload a video and generate transcription before adding subtitles.");
            return;
        }

        setLoading(true);
        const formData = new FormData();

        // Convert transcription to subtitle format (SRT in this case)
        const srtContent = transcription.map((seg, index) =>
            `${index + 1}\n${formatTime(seg.start, true)} --> ${formatTime(seg.end, true)}\n${seg.text}\n`
        ).join("\n");

        const subtitleBlob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
        const subtitleFile = new File([subtitleBlob], "subtitles.srt");

        formData.append("video", file);
        formData.append("subtitles", subtitleFile);

        try {
            const response = await axios.post("http://localhost:8000/add_subtitles/", formData, {
                responseType: "blob",
            });

            // Create a URL for the video with subtitles
            const videoBlob = new Blob([response.data], { type: "video/mp4" });
            const videoURL = URL.createObjectURL(videoBlob);

            setSubtitledMediaURL(videoURL); // Set the new video URL with subtitles
            setVideoWithSubtitles(videoBlob); // Save the video blob for downloading

        } catch (error) {
            console.error("Error adding subtitles:", error);
            alert("An error occurred while adding subtitles.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadVideo = () => {
        if (videoWithSubtitles) {
            FileSaver.saveAs(videoWithSubtitles, "video_with_subtitles.mp4");
        } else {
            alert("No video with subtitles available for download.");
        }
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
            <label htmlFor="file-upload" className="upload-label">Upload File</label>
            <input id="file-upload" type="file" accept="audio/*,video/*" onChange={handleFileChange} className="file-input" />

            {mediaURL && (
                <div className="media-preview">
                    <h3>Preview</h3>
                    {file && file.type.startsWith("video") ? (
                        <video controls src={subtitledMediaURL || mediaURL} /> // Replace video source when subtitled video is available
                    ) : (
                        <audio controls src={mediaURL} />
                    )}
                </div>
            )}

            <div className="action-buttons">
                <button onClick={handleTranscribe} disabled={loading}>Transcribe</button>
                <button onClick={handleAddSubtitles} disabled={loading || !processingComplete}>Add Subtitles</button>
                <button onClick={handleDownloadVideo} disabled={!videoWithSubtitles}>Download Video with Subtitles</button>
            </div>

            {loading && (
                <div className="loading">
                    Processing...
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
        </div>
    );
};

export default Transcriber;
