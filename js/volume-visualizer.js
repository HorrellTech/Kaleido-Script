class VolumeVisualizer {
    constructor() {
        this.meterElement = document.querySelector('.db-meter');
        this.levelElement = document.querySelector('.db-meter-level');
        this.valueElement = document.querySelector('.db-value');
        this.visualizerType = 0; // Track current visualization type
        this.visualizerTypes = ['db', 'peak', 'rms', 'spectrum']; // Different visualization modes
        this.peakVolume = -100; // Keep track of peak volume
        this.peakHoldTime = 0; // Counter for how long to hold peak

        this.initEventListeners();
        this.animate();
    }

    initEventListeners() {
        // Change visualization type on click
        if (this.meterElement) {
            this.meterElement.addEventListener('click', () => {
                this.visualizerType = (this.visualizerType + 1) % this.visualizerTypes.length;
                window.logToConsole(`Volume display: ${this.visualizerTypes[this.visualizerType]} mode`);
            });
        }
    }

    // Calculate decibels from linear volume (0-1)
    linearToDb(linear) {
        // Avoid log(0) which is -Infinity
        if (linear < 0.0001) return -100;
        return 20 * Math.log10(linear);
    }

    // Update visualization based on audio level
    updateVisualization() {
        if (!this.levelElement || !this.valueElement) return;

        let volume = 0;
        let dbValue = -100;
        let displayText = '-∞ dB';
        
        // Get volume data from audio processor if available
        if (window.audioProcessor) {
            switch (this.visualizerTypes[this.visualizerType]) {
                case 'peak':
                    volume = window.audioProcessor.getVolumeLevel() || 0;
                    // Hold peak for a bit
                    if (volume > this.peakVolume) {
                        this.peakVolume = volume;
                        this.peakHoldTime = 30; // Hold for 30 frames
                    } else {
                        this.peakHoldTime--;
                        if (this.peakHoldTime <= 0) {
                            this.peakVolume = Math.max(volume, this.peakVolume * 0.95); // Decay slowly
                        }
                    }
                    volume = this.peakVolume;
                    dbValue = this.linearToDb(volume);
                    displayText = `${dbValue.toFixed(1)} dB pk`;
                    break;

                case 'spectrum':
                    // Create a basic spectrum visualization showing bass/mid/high balance
                    const bass = window.audioProcessor.getAudioFrequency(100) || 0;
                    const mid = window.audioProcessor.getAudioFrequency(1000) || 0;
                    const high = window.audioProcessor.getAudioFrequency(5000) || 0;
                    volume = (bass + mid + high) / 3;
                    displayText = `B:${(bass*100).toFixed(0)}% M:${(mid*100).toFixed(0)}%`;
                    break;

                case 'rms':
                    // Smoother RMS-style volume display
                    const currentVolume = window.audioProcessor.getVolumeLevel() || 0;
                    // Use a smoother RMS-like calculation
                    this._rmsBuffer = this._rmsBuffer || currentVolume;
                    this._rmsBuffer = (this._rmsBuffer * 0.9) + (currentVolume * 0.1); // Smooth transitions
                    volume = this._rmsBuffer;
                    dbValue = this.linearToDb(volume);
                    displayText = `${dbValue.toFixed(1)} dB rms`;
                    break;

                case 'db':
                default:
                    volume = window.audioProcessor.getVolumeLevel() || 0;
                    dbValue = this.linearToDb(volume);
                    displayText = `${dbValue.toFixed(1)} dB`;
                    break;
            }
            
            // Update meter display (invert level since it shows from right side)
            const levelPercentage = 100 - Math.min(100, Math.max(0, (volume * 100)));
            this.levelElement.style.width = `${levelPercentage}%`;
            
            // Update numeric display
            this.valueElement.textContent = displayText;
            
            // Change color based on level
            if (dbValue > -6) {
                this.valueElement.style.color = '#e74c3c'; // Red for loud
            } else if (dbValue > -18) {
                this.valueElement.style.color = '#f1c40f'; // Yellow for moderate
            } else {
                this.valueElement.style.color = '#2ecc71'; // Green for quiet
            }
        } else {
            // No audio processor available
            this.levelElement.style.width = '100%';
            this.valueElement.textContent = 'No audio';
        }
    }

    animate() {
        this.updateVisualization();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the volume visualizer when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.volumeVisualizer = new VolumeVisualizer();
});