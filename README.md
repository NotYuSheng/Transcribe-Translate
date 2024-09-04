# Transcribe-Translate

![GitHub last commit](https://img.shields.io/github/last-commit/NotYuSheng/Transcribe-Translate?color=red)
[![Sphinx](https://img.shields.io/badge/Sphinx-000?logo=sphinx&logoColor=fff)](https://notyusheng.github.io/Transcribe-Translate/index.html)

## Documentation
> [!NOTE]  
> Documentation is currently under development
You can access the project documentation at [[GitHub Pages](https://notyusheng.github.io/Transcribe-Translate/)].

## Host requirements
- **Docker**: [[Installation Guide](https://docs.docker.com/engine/install/)]
- **Docker Compose**: [[Installation Guide](https://docs.docker.com/compose/install/)]
- Compatibile with Linux and Windows Host
- Ensure port 3000 and 8000 are not already in use
- Project can be ran on either CPU or GPU

## Model requirements
The following table outlines the recommended hardware requirements for each Whisper model based on typical usage scenarios. Please ensure that your system meets or exceeds these specifications for optimal performance.

| Model      | Size (GB) | Minimum RAM (GB) | Recommended RAM (GB) | GPU Memory (VRAM) (GB) | Notes                                             |
|------------|------------|------------------|----------------------|------------------------|---------------------------------------------------|
| `tiny`     | ~0.07      | 2                | 4                    | 1                      | Suitable for lightweight tasks and low resource usage. |
| `base`     | ~0.14      | 4                | 6                    | 2                      | Good for basic transcription and smaller workloads. |
| `small`    | ~0.46      | 6                | 8                    | 4                      | Ideal for moderate tasks, offering a balance between performance and accuracy. |
| `medium`   | ~1.5       | 8                | 12                   | 8                      | Recommended for larger tasks with higher accuracy demands. |
| `large-v2` | ~2.88      | 10               | 16                   | 10                     | Best for high-performance tasks and large-scale transcription. |
| `large-v3` | ~2.88      | 12               | 16+                  | 10+                    | Highest accuracy and resource usage. Ideal for GPU-accelerated environments. |

> [!TIP]
> For models running on GPU, using CUDA-enabled GPUs with sufficient VRAM is recommended to significantly improve performance. CPU-based inference may require additional RAM and processing time.

## Supported formats

### Import Options:
- Audio: .mp3, .wav, .flac, .m4a, etc.
- Video: .mp4, .mkv, .avi, .mov, etc.

### Export Options: 
- Users can export the results in .txt, .json, .srt, or .vtt formats.


## Usage
> [!NOTE]
> Project will run on GPU by default. To run on CPU, use the `docker-compose.cpu.yml` instead

> [!IMPORTANT]  
> If running on Windows with GPU, run commands from WSL terminal to avoid volume mounting issues

1.  Clone this repository and navigate to project folder
```
git clone https://github.com/NotYuSheng/Transcribe-Translate.git
cd Transcribe-Translate
```

2.  Build the Docker images:
```
docker-compose build
```

3.  Run images
```
docker-compose up -d
```

4.  Access webpage from host
```
<host-ip>:3000
```

API calls to Whisper server can be made to (refer to <host-ip>:8000/docs for more info)
```
<host-ip>:8000
```
