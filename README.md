# Transcribe-Translate

![GitHub last commit](https://img.shields.io/github/last-commit/NotYuSheng/Transcribe-Translate?color=red)
[![Sphinx](https://img.shields.io/badge/Sphinx-000?logo=sphinx&logoColor=fff)](https://notyusheng.github.io/Transcribe-Translate/index.html)

> [!NOTE] 
This project is currently under development.

## Documentation
You can access the project documentation at [[GitHub Pages](https://notyusheng.github.io/Transcribe-Translate/)].

## Host requirements
- **Docker**: [[Installation Guide](https://docs.docker.com/engine/install/)]
- **Docker Compose**: [[Installation Guide](https://docs.docker.com/compose/install/)]
- Compatibile with Linux and Windows Host
- Ensure port 3000 and 8000 are not already in use
- Project can be ran on either CPU or GPU

## Usage
> [!NOTE] 
Project will run on GPU by default. To run on CPU, use the `docker-compose.cpu.yml` instead

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
