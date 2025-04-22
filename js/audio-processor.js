/**
 * Audio Processor for KaleidoScript
 * Handles importing, analyzing, and processing audio for reactive visualizations
 */

class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.audioSource = null;
        this.analyser = null;
        this.audioBuffer = null;
        this.audioData = {};
        this.isPlaying = false;
        this.audioElement = document.getElementById('audio-preview');
        this.audioFiles = {}; // Store loaded audio files
        this.currentAudioName = null; // Track the name of the currently loaded audio
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const importAudioBtn = document.getElementById('import-audio-btn');
        if (importAudioBtn) {
            importAudioBtn.addEventListener('click', () => this.importAudio());
        }
        
        // Connect audio player events
        if (this.audioElement) {
            this.audioElement.addEventListener('play', () => {
                // Only initialize audio context if needed
                if (!this.audioContext) {
                    this.initAudioContext();
                } else if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                // Don't call play() here - it would create a circular reference
                this.isPlaying = true;
            });
            
            this.audioElement.addEventListener('pause', () => {
                this.isPlaying = false;
            });
            
            this.audioElement.addEventListener('ended', () => {
                this.isPlaying = false;
                this.audioElement.currentTime = 0;
            });
        }
    }
    
    importAudio() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'audio/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const audioPlayer = document.querySelector('.audio-player');
            if (audioPlayer) {
                audioPlayer.style.display = 'block';
            }
            
            // Add to audio list
            this.addAudioToList(file);
            
            // Set up audio preview
            const audioURL = URL.createObjectURL(file);
            this.audioElement.src = audioURL;
            
            // Store the audio file reference
            this.audioFiles[file.name] = audioURL;
            
            // Load into audio context for analysis
            this.loadAudioFile(file);
            
            // Make it available to the interpreter
            if (window.interpreter) {
                window.interpreter.registerAudioFile(file.name, audioURL);
            }
        };
        input.click();
    }
    
    addAudioToList(file) {
        const audioList = document.querySelector('.audio-list');
        if (!audioList) return;
        
        const audioItem = document.createElement('div');
        audioItem.className = 'audio-item';
        audioItem.dataset.filename = file.name;
        
        const audioIcon = document.createElement('i');
        audioIcon.className = 'fas fa-music';
        
        const audioName = document.createElement('span');
        audioName.className = 'audio-name';
        audioName.textContent = file.name;
        
        const audioActions = document.createElement('div');
        audioActions.className = 'audio-actions';
        
        const playBtn = document.createElement('button');
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
        playBtn.title = 'Play';
        playBtn.onclick = (e) => {
            e.stopPropagation();
            
            // Make sure audio context is initialized before playing
            if (!this.audioContext) {
                this.initAudioContext();
            }
            
            // Set source first, then play after a short delay to avoid interruption
            this.audioElement.src = this.audioFiles[file.name];
            
            // Wait for canplay event instead of playing immediately
            this.audioElement.oncanplay = () => {
                this.audioElement.oncanplay = null; // Remove the event handler
                this.play(); // Use our play method instead of direct play()
            };
            
            this.audioElement.load(); // Explicitly load before playing
        };
        
        const insertBtn = document.createElement('button');
        insertBtn.innerHTML = '<i class="fas fa-code"></i>';
        insertBtn.title = 'Insert code';
        insertBtn.onclick = (e) => {
            e.stopPropagation();
            if (window.editor) {
                const code = `loadAudio("${file.name}")`;
                window.editor.replaceSelection(code);
                window.logToConsole(`Code for audio ${file.name} inserted`);
            }
        };
        
        // Rest of the method remains the same...
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = 'Delete';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            audioList.removeChild(audioItem);
            if (this.audioElement.src.includes(file.name)) {
                this.audioElement.src = '';
                this.stop();
                const audioPlayer = document.querySelector('.audio-player');
                if (audioPlayer) {
                    audioPlayer.style.display = 'none';
                }
            }
            
            // Remove from stored files
            delete this.audioFiles[file.name];
            
            // Also remove from interpreter
            if (window.interpreter && window.interpreter.audioFiles) {
                delete window.interpreter.audioFiles[file.name];
            }
        };
        
        audioActions.appendChild(playBtn);
        audioActions.appendChild(insertBtn);
        audioActions.appendChild(deleteBtn);
        
        audioItem.appendChild(audioIcon);
        audioItem.appendChild(audioName);
        audioItem.appendChild(audioActions);
        
        // Add click event to insert audio code at cursor
        audioItem.addEventListener('click', () => {
            if (window.editor) {
                const code = `loadAudio("${file.name}")`;
                window.editor.replaceSelection(code);
                window.logToConsole(`Audio ${file.name} inserted`);
            }
        });
        
        audioList.appendChild(audioItem);
    }
    
    loadAudioFile(file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const arrayBuffer = event.target.result;
            this.initAudioContext();
            
            // Decode the audio file
            this.audioContext.decodeAudioData(arrayBuffer, 
                (buffer) => {
                    this.audioBuffer = buffer;
                    console.log('Audio loaded successfully');
                    
                    // Store basic audio data for use in scripts
                    this.audioData = {
                        duration: buffer.duration,
                        numberOfChannels: buffer.numberOfChannels,
                        sampleRate: buffer.sampleRate,
                        name: file.name
                    };
                    
                    window.logToConsole(`Audio ${file.name} loaded successfully`);
                },
                (error) => {
                    console.error('Error decoding audio data', error);
                    window.logToConsole(`Error decoding audio: ${error}`, 'error');
                }
            );
        };
        reader.readAsArrayBuffer(file);
    }
    
    // Load audio from URL (used by interpreter)
    loadAudioFromURL(name, url) {
        return new Promise((resolve, reject) => {
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.arrayBuffer();
                })
                .then(arrayBuffer => {
                    this.initAudioContext();
                    
                    // Create a copy of the array buffer for the blob
                    const arrayBufferCopy = arrayBuffer.slice(0);
                    
                    // Return the decoded audio data
                    return this.audioContext.decodeAudioData(arrayBuffer)
                        .then(audioBuffer => ({ audioBuffer, arrayBufferCopy }));
                })
                .then(({ audioBuffer, arrayBufferCopy }) => {
                    this.audioBuffer = audioBuffer;
                    this.audioData = {
                        duration: audioBuffer.duration,
                        numberOfChannels: audioBuffer.numberOfChannels,
                        sampleRate: audioBuffer.sampleRate,
                        name: name
                    };
                    
                    // Save the current audio name
                    this.currentAudioName = name;
                    
                    // Set up the audio element with the loaded audio
                    if (this.audioElement) {
                        // Stop any current playback to avoid conflicts
                        if (this.audioElement.currentTime > 0 && !this.audioElement.paused) {
                            this.audioElement.pause();
                        }
                        
                        // If we already have a blob URL for this file, revoke it
                        if (this.audioFiles[name] && this.audioFiles[name].startsWith('blob:')) {
                            URL.revokeObjectURL(this.audioFiles[name]);
                        }
                        
                        // Get the MIME type based on the file extension
                        let mimeType = 'audio/mpeg'; // default
                        
                        if (name.toLowerCase().endsWith('.wav')) {
                            mimeType = 'audio/wav';
                        } else if (name.toLowerCase().endsWith('.ogg')) {
                            mimeType = 'audio/ogg';
                        } else if (name.toLowerCase().endsWith('.mp3')) {
                            mimeType = 'audio/mpeg';
                        }
                        
                        // Create a blob from the array buffer
                        const blob = new Blob([arrayBufferCopy], { type: mimeType });
                        const blobUrl = URL.createObjectURL(blob);
                        
                        // Store the blob URL
                        this.audioFiles[name] = blobUrl;
                        
                        // Set the audio source and load it
                        this.audioElement.oncanplaythrough = () => {
                            this.audioElement.oncanplaythrough = null;
                            window.logToConsole(`Audio ${name} loaded successfully`);
                            resolve(this.audioData);
                        };
                        
                        this.audioElement.src = blobUrl;
                        this.audioElement.load();
                    } else {
                        window.logToConsole(`Audio ${name} loaded successfully`);
                        resolve(this.audioData);
                    }
                })
                .catch(error => {
                    console.error('Error loading audio from URL:', error);
                    window.logToConsole(`Error loading audio: ${error}`, 'error');
                    reject(error);
                });
        });
    }

    resetAudioConnections() {
        console.log('Resetting audio connections...');
        
        // Disconnect any existing audio connections
        if (this.audioSource) {
            try {
                this.audioSource.disconnect();
            } catch (e) {
                console.log('Error disconnecting audio source:', e);
            }
            this.audioSource = null;
        }
        
        if (this.analyser) {
            try {
                this.analyser.disconnect();
            } catch (e) {
                console.log('Error disconnecting analyzer:', e);
            }
        }
        
        if (this.limiter) {
            try {
                this.limiter.disconnect();
            } catch (e) {
                console.log('Error disconnecting limiter:', e);
            }
        }
        
        // Don't close the audio context here - that's too aggressive 
        // Just release references to the nodes
        this.analyser = null;
        this.limiter = null;
        
        console.log('Audio connections reset');
    }

    registerAudioFile(name, url) {
        if (!this.audioFiles) {
            this.audioFiles = {};
        }
        
        this.audioFiles[name] = url;
        
        // Make it available to the interpreter as well
        if (window.interpreter) {
            window.interpreter.registerAudioFile(name, url);
        }
        
        if (window.logToConsole) {
            window.logToConsole(`Registered audio file: ${name}`, 'info');
        }
    }
    
    initAudioContext() {
        try {
            if (!this.audioContext) {
                console.log("Creating new audio context");
                // Create audio context
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Make sure it's running
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                // Don't create source connection here - wait until it's needed
                // This prevents the "already connected" error
                console.log('Audio context created, state:', this.audioContext.state);
            } else if (this.audioContext.state === 'suspended') {
                // Resume context if it's suspended (browser policy)
                this.audioContext.resume();
                console.log('Audio context resumed from suspended state');
            }
        } catch (error) {
            console.error('Error initializing audio context:', error);
        }
    }
    
    // Play audio from the beginning or resume
    play() {
        if (!this.audioElement) return;
        
        try {
            // Make sure audio context is initialized
            this.initAudioContext();
            
            // Ensure we have audio connections before playing
            //if (!this.audioSource || !this.analyser) {
                console.log('Setting up audio connections before playing');
                this.ensureAudioConnections();
            //}
            
            // Resume the audio context if it's suspended (important for Chrome)
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('Audio context resumed successfully');
                }).catch(err => {
                    console.error('Error resuming audio context:', err);
                });
            }
            
            // If we're recording, make sure this audio is captured in the recording
            if (window.isRecording && window.recordingGainNode && this.audioSource) {
                try {
                    // Disconnect from the recording gain node first to avoid duplicates
                    try {
                        this.audioSource.disconnect(window.recordingGainNode);
                    } catch (e) {
                        // Ignore errors if not connected
                    }
                    
                    // Connect to the recording gain node
                    console.log('Connecting audio to recording stream');
                    this.audioSource.connect(window.recordingGainNode);
                } catch (e) {
                    console.error('Error connecting audio to recording:', e);
                }
            }
            
            // Check if the audio element has a valid source
            if (!this.audioElement.src || this.audioElement.src === '') {
                console.error('No audio source set before playing');
                window.logToConsole('Error: No audio source selected', 'error');
                return;
            }
            
            // Play the audio with better error handling
            console.log('Playing audio:', this.audioElement.src);
            
            // Make sure it's ready to play
            if (this.audioElement.readyState < 2) {  // HAVE_CURRENT_DATA = 2
                console.log('Audio not ready yet, loading...');
                
                // Set up a one-time canplay event
                const canPlayHandler = () => {
                    console.log('Audio ready, playing now');
                    this.audioElement.play()
                        .then(() => {
                            this.isPlaying = true;
                            console.log('Audio playing successfully');
                        })
                        .catch(err => {
                            console.error('Error playing audio:', err);
                            window.logToConsole(`Error playing audio: ${err.message}`, 'error');
                        });
                    
                    // Remove the event handler
                    this.audioElement.removeEventListener('canplay', canPlayHandler);
                };
                
                this.audioElement.addEventListener('canplay', canPlayHandler);
                
                // Also set a timeout in case the canplay event doesn't fire
                setTimeout(() => {
                    // If still not playing after timeout, try playing anyway
                    if (!this.isPlaying) {
                        console.log('Timeout reached, trying to play anyway');
                        this.audioElement.play()
                            .then(() => {
                                this.isPlaying = true;
                                console.log('Audio playing after timeout');
                            })
                            .catch(err => {
                                console.error('Error playing audio after timeout:', err);
                                window.logToConsole(`Still cannot play audio: ${err.message}`, 'error');
                            });
                    }
                }, 2000);
                
                // Trigger loading if needed
                this.audioElement.load();
            } else {
                // Audio is ready, play immediately
                this.audioElement.play()
                    .then(() => {
                        this.isPlaying = true;
                        console.log('Audio playing immediately');
                    })
                    .catch(err => {
                        console.error('Error playing ready audio:', err);
                        window.logToConsole(`Error playing audio: ${err.message}`, 'error');
                    });
            }
        } catch (error) {
            console.error('Critical error in audio play:', error);
            window.logToConsole(`Critical audio error: ${error.message}`, 'error');
            
            // Try a complete reset as last resort
            this.resetAudioConnections();
            setTimeout(() => {
                this.initAudioContext();
                console.log('Audio system reset after critical error');
            }, 500);
        }
    }

    ensureAudioConnections() {
        if (!this.audioContext || !this.audioElement) return;
        
        try {
            // Check if the source is already connected properly
            if (this.audioSource && this.analyser && this.limiter) {
                console.log('Audio connections already established, skipping reconnection');
                return;
            }
            
            // First, disconnect any existing connections to prevent multiple connections
            if (this.audioSource) {
                try {
                    this.audioSource.disconnect();
                } catch (e) {
                    // Ignore errors if not already connected
                    console.log('Error disconnecting audio source:', e);
                }
                this.audioSource = null;
            }
            
            // Verify the audio context state
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            // Create a fresh audio source
            try {
                this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
            } catch (e) {
                if (e.message.includes('already connected')) {
                    console.log('Audio element already connected - creating a new context');
                    // If we get here, we need to reset everything and create a new audio context
                    this.resetAudioConnections();
                    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    this.audioSource = this.audioContext.createMediaElementSource(this.audioElement);
                } else {
                    throw e;
                }
            }
            
            // Create analyzer if needed
            if (!this.analyser) {
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 2048;
                this.analyser.smoothingTimeConstant = 0.8;
            }
            
            // Create limiter if needed
            if (!this.limiter) {
                this.limiter = this.audioContext.createDynamicsCompressor();
                this.limiter.threshold.value = -3.0;
                this.limiter.knee.value = 1.0;
                this.limiter.ratio.value = 20.0;
                this.limiter.attack.value = 0.003;
                this.limiter.release.value = 0.25;
            }
            
            // Create connections with limiter in the chain
            console.log('Establishing audio connections...');
            this.audioSource.connect(this.analyser);
            this.analyser.connect(this.limiter);
            this.limiter.connect(this.audioContext.destination);
            
            console.log('Audio connections established successfully');
        } catch (error) {
            console.error('Error establishing audio connections:', error);
            
            // Last resort fallback - create a completely new audio setup
            try {
                this.resetAudioConnections();
                this.initAudioContext();
                console.log('Audio system recreated after error');
            } catch (e) {
                console.error('Critical audio system failure:', e);
            }
        }
    }

    // Pause the audio
    pause() {
        if (!this.audioElement) return false;
        
        try {
            this.audioElement.pause();
            this.isPlaying = false;
            return true;
        } catch (error) {
            window.logToConsole("Error pausing audio:", error);
            return false;
        }
    }

    // Stop and reset the audio to the beginning
    stop() {
        if (!this.audioElement) return false;
        
        try {
            // First pause the audio
            this.audioElement.pause();
            
            // Then reset the time
            this.audioElement.currentTime = 0;
            
            // Update state
            this.isPlaying = false;
            
            // No need to disconnect/reconnect - just keep the connections
            
            return true;
        } catch (error) {
            window.logToConsole("Error stopping audio:", error);
            return false;
        }
    }

    // Reset everything, used when reloading a new script
    reset() {
        this.stop();
        this.isPlaying = false;

        // Reset all audio connections
        this.resetAudioConnections();
        
        // Don't clear audioBuffer or audioFiles as they might be reused
    }

    /**
     * Get the current volume level with improved accuracy
     * @returns {number} Volume level from 0-1
     */
    getVolumeLevel() {
        if (!this.analyser || !this.isPlaying) return 0;
        
        try {
            // Get frequency data for a more accurate volume reading
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.analyser.getByteFrequencyData(dataArray);
            
            // Calculate average volume across all frequencies
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += dataArray[i];
            }
            
            // Scale down to 0-1 range and apply some non-linear scaling for better visual feedback
            const average = sum / bufferLength / 255;
            return Math.pow(average, 0.7); // Slightly compress the range for better visual feedback
            
        } catch (error) {
            console.error('Error getting volume level:', error);
            return 0;
        }
    }

    loadExampleSongs() {
        const exampleSongsPath = 'example_songs';
        
        // First check if the directory exists using a fetch request
        fetch(exampleSongsPath + '/')
            .then(response => {
                if (response.ok) {
                    // Try to load a directory listing or predefined list of songs
                    return this.fetchDirectoryListing(exampleSongsPath);
                } else {
                    console.warn('Example songs directory not accessible');
                    window.logToConsole('Example songs directory not found', 'warning');
                    return [];
                }
            })
            .then(songList => {
                if (songList && songList.length > 0) {
                    // Register each song in the list
                    songList.forEach(song => {
                        const fullPath = `${exampleSongsPath}/${song}`;
                        this.registerAudioFile(song, fullPath);
                        
                        // Also add to UI if needed
                        this.addExampleSongToList(song, fullPath);
                    });
                    
                    window.logToConsole(`Loaded ${songList.length} example songs`, 'info');
                }
            })
            .catch(error => {
                console.error('Error loading example songs:', error);
            });
    }
    
    // Methods for script access
    
    /**
     * Get frequency data from the current audio
     * @param {number} count - Number of frequency bins to return
     * @returns {Uint8Array} - Array of frequency values (0-255)
     */
    getFrequencyData(count = 256) {
        if (!this.analyser || !this.isPlaying) {
            return new Uint8Array(count).fill(0);
        }
        
        const dataArray = new Uint8Array(count);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }
    
    /**
     * Get the frequency value at a specific frequency
     * @param {number} targetFreq - The frequency to analyze
     * @returns {number} - Value between 0 and 1 representing the intensity at that frequency
     */
    getAudioFrequency(targetFreq) {
        if (!this.audioContext || !this.analyser || !this.isPlaying) {
            return 0;
        }
        
        try {
            // Make sure we have an array to store frequency data
            if (!this.frequencyData) {
                this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
            }
            
            // Get current frequency data
            this.analyser.getByteFrequencyData(this.frequencyData);
            
            // Map target frequency to the index in the frequency data array
            const nyquist = this.audioContext.sampleRate / 2;
            const index = Math.round((targetFreq / nyquist) * this.frequencyData.length);
            
            // Make sure the index is in bounds and return normalized value (0-1)
            if (index >= 0 && index < this.frequencyData.length) {
                return this.frequencyData[index] / 255;
            } else {
                return 0;
            }
        } catch (error) {
            console.error('Error getting audio frequency:', error);
            return 0;
        }
    }
    
    /**
     * Get waveform data from the current audio
     * @param {number} count - Number of time domain bins to return
     * @returns {Uint8Array} - Array of waveform values (0-255)
     */
    getWaveformData(count = 256) {
        if (!this.analyser || !this.isPlaying) {
            return new Uint8Array(count).fill(128);
        }
        
        const dataArray = new Uint8Array(count);
        this.analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }
    
    /**
     * Get the current playback position in seconds
     * @returns {number} - Current playback position
     */
    getCurrentTime() {
        return this.audioElement ? this.audioElement.currentTime : 0;
    }
    
    /**
     * Get total audio duration in seconds
     * @returns {number} - Audio duration
     */
    getDuration() {
        return this.audioData.duration || 0;
    }
    
    /**
     * Check if audio is currently playing
     * @returns {boolean} - True if playing
     */
    isAudioPlaying() {
        return this.isPlaying;
    }
    
    /**
     * Get the average volume level (0-1)
     * @returns {number} - Volume level
     */
    getVolumeLevel() {
        if (!this.analyser || !this.isPlaying) {
            return 0;
        }
        
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate average
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        
        return sum / (dataArray.length * 255); // Normalize to 0-1
    }

    /**
     * Set the animation duration to match the audio duration
     * @returns {number} The duration that was set, or 0 if no audio loaded
     */
    setAnimationDurationToAudio() {
        if (!this.audioData || !this.audioData.duration) {
            window.logToConsole('No audio loaded or audio duration unavailable', 'warning');
            return 0;
        }
        
        const durationInput = document.getElementById('duration-input');
        if (durationInput) {
            const audioDuration = Math.ceil(this.audioData.duration);
            durationInput.value = audioDuration;
            
            // Also update the renderer duration if it exists
            if (window.renderer) {
                window.renderer.setDuration(audioDuration);
            }
            
            window.logToConsole(`Animation duration set to audio length: ${audioDuration}s`, 'info');
            return audioDuration;
        }
        
        return 0;
    }
}

// Initialize the audio processor
const audioProcessor = new AudioProcessor();

// Export for interpreter access
window.audioProcessor = audioProcessor;
