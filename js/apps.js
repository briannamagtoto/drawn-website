class DesktopApps {
    constructor() {
        this.drawings = []; // Store all submitted drawings
        this.currentStream = null; // Store webcam stream
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        this.animationFrameId = null;

        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAppIcons());
        } else {
            this.setupAppIcons();
        }
    }

    // ========================================
    // DESKTOP ICONS SETUP
    // ========================================

    setupAppIcons() {
        // Camera icon
        const cameraIcon = document.getElementById('cameraIcon');
        if (cameraIcon) {
            cameraIcon.addEventListener('dblclick', () => this.openCamera());
        }

        // Notepad icon
        const notepadIcon = document.getElementById('notepadIcon');
        if (notepadIcon) {
            notepadIcon.addEventListener('dblclick', () => this.openNotepad());
        }

        // Gallery icon
        const galleryIcon = document.getElementById('galleryIcon');
        if (galleryIcon) {
            galleryIcon.addEventListener('dblclick', () => this.openGallery());
        }

        console.log('✓ Desktop app icons initialized');
    }

    // ========================================
    // CAMERA APP
    // ========================================

    openCamera() {
        if (window.windowManager) {
            window.windowManager.showWindow('cameraWindow');
            // windowManager.showWindow calls startWebcam automatically
        } else {
            const cameraWindow = document.getElementById('cameraWindow');
            if (cameraWindow) {
                cameraWindow.classList.add('active');
                this.startWebcam();
            }
        }
    }

    async startWebcam() {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');

        if (!video || !canvas) {
            console.error('Camera elements not found');
            return;
        }

        const ctx = canvas.getContext('2d');

        try {
            // Stop any existing stream and animation first
            if (this.animationFrameId) {
                cancelAnimationFrame(this.animationFrameId);
                this.animationFrameId = null;
            }

            if (this.currentStream) {
                this.currentStream.getTracks().forEach(track => track.stop());
                this.currentStream = null;
            }

            // Fully reset video element
            video.srcObject = null;
            video.pause();

            // Small delay to ensure video element is fully reset
            await new Promise(resolve => setTimeout(resolve, 100));

            // Request fresh webcam access
            this.currentStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            // Set new stream to video element
            video.srcObject = this.currentStream;

            // Wait for video to be ready and playing
            await video.play();

            // Set canvas dimensions and start rendering
            const startRendering = () => {
                if (video.videoWidth === 0 || video.videoHeight === 0) {
                    setTimeout(startRendering, 50);
                    return;
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                this.renderCameraFrame(video, canvas, ctx);
            };

            // Handle both cases: metadata already loaded or needs to load
            if (video.readyState >= 2 && video.videoWidth > 0) {
                startRendering();
            } else {
                video.addEventListener('loadedmetadata', startRendering, { once: true });
            }

        } catch (error) {
            console.error('Error accessing webcam:', error);

            let errorMessage = 'Could not access webcam. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please allow camera permissions in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera found on this device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Camera is already in use by another application.';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        }
    }

    renderCameraFrame(video, canvas, ctx) {
        if (!video || video.paused || video.ended) {
            return;
        }

        // Check if window is still active
        const cameraWindow = document.getElementById('cameraWindow');
        if (!cameraWindow || !cameraWindow.classList.contains('active')) {
            return;
        }

        // Check if in drawn mode - if yes, apply sketch filter
        const isDrawnMode = document.body.classList.contains('drawn-mode');

        if (isDrawnMode) {
            this.applySketchFilter(video, canvas, ctx);
        } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        // Continue animation loop
        this.animationFrameId = requestAnimationFrame(() =>
            this.renderCameraFrame(video, canvas, ctx)
        );
    }

    applySketchFilter(video, canvas, ctx) {
        // Draw original video
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        // Create output buffer
        const output = ctx.createImageData(width, height);

        // Black & white sketch filter with edge detection
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                // Get neighboring pixels for edge detection
                const tl = ((y - 1) * width + (x - 1)) * 4;
                const tr = ((y - 1) * width + (x + 1)) * 4;
                const bl = ((y + 1) * width + (x - 1)) * 4;
                const br = ((y + 1) * width + (x + 1)) * 4;

                // Convert to grayscale first
                const gray = (data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114);

                // Calculate gradients for edge detection (Sobel-like filter)
                const grayTL = (data[tl] * 0.299 + data[tl + 1] * 0.587 + data[tl + 2] * 0.114);
                const grayTR = (data[tr] * 0.299 + data[tr + 1] * 0.587 + data[tr + 2] * 0.114);
                const grayBL = (data[bl] * 0.299 + data[bl + 1] * 0.587 + data[bl + 2] * 0.114);
                const grayBR = (data[br] * 0.299 + data[br + 1] * 0.587 + data[br + 2] * 0.114);

                const gx = (grayTR + grayBR) - (grayTL + grayBL);
                const gy = (grayBL + grayBR) - (grayTL + grayTR);
                const magnitude = Math.sqrt(gx * gx + gy * gy);

                // Pencil sketch effect: invert edges
                const threshold = 30;
                const isEdge = magnitude > threshold;

                // Create sketch look: white background with black lines
                let value;
                if (isEdge) {
                    // Dark pencil lines on edges
                    value = Math.max(0, 255 - magnitude);
                } else {
                    // Light sketch texture based on original gray value
                    value = Math.min(255, gray + 30); // Brighten non-edges for paper look
                }

                // Apply same value to R, G, B for black & white
                output.data[idx] = value;
                output.data[idx + 1] = value;
                output.data[idx + 2] = value;
                output.data[idx + 3] = 255; // Full opacity
            }
        }

        // Draw filtered image
        ctx.putImageData(output, 0, 0);
    }


    stopCamera() {
        // Stop animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Stop all webcam stream tracks
        if (this.currentStream) {
            this.currentStream.getTracks().forEach(track => track.stop());
            this.currentStream = null;
        }

        // Clear video element completely
        const video = document.getElementById('cameraVideo');
        if (video) {
            video.srcObject = null;
            video.pause();
            video.load();
        }

        // Clear canvas
        const canvas = document.getElementById('cameraCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    closeCamera() {
        this.stopCamera();
        if (window.windowManager) {
            window.windowManager.hideWindow('cameraWindow');
        } else {
            const cameraWindow = document.getElementById('cameraWindow');
            if (cameraWindow) {
                cameraWindow.classList.remove('active');
            }
        }
    }

    // ========================================
    // NOTEPAD APP
    // ========================================

    openNotepad() {
        if (window.windowManager) {
            window.windowManager.showWindow('notepadWindow');
        } else {
            const notepadWindow = document.getElementById('notepadWindow');
            if (notepadWindow) {
                notepadWindow.classList.add('active');
                this.setupDrawingCanvas();
            }
        }
    }

    setupDrawingCanvas() {
        this.canvas = document.getElementById('notepadCanvas');
        if (!this.canvas) {
            console.error('Notepad canvas not found');
            return;
        }

        // Set canvas size to match its display size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.ctx = this.canvas.getContext('2d');

        // Fill with white background
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set up drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Remove old listeners if they exist
        const newCanvas = this.canvas.cloneNode(true);
        this.canvas.parentNode.replaceChild(newCanvas, this.canvas);
        this.canvas = newCanvas;
        this.ctx = this.canvas.getContext('2d');

        // Fill with white background again
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.stopDrawing());
        this.canvas.addEventListener('mouseleave', () => this.stopDrawing());

        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.canvas.dispatchEvent(mouseEvent);
        });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            const mouseEvent = new MouseEvent('mouseup', {});
            this.canvas.dispatchEvent(mouseEvent);
        });

        console.log('✓ Drawing canvas initialized:', this.canvas.width, 'x', this.canvas.height);
    }

    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Get current color and size
        const colorInput = document.getElementById('penColor');
        const sizeInput = document.getElementById('penSize');

        const color = colorInput ? colorInput.value : '#000000';
        const size = sizeInput ? parseInt(sizeInput.value) : 3;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = size;

        this.ctx.beginPath();
        this.ctx.moveTo(this.lastX, this.lastY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();

        this.lastX = x;
        this.lastY = y;
    }

    stopDrawing() {
        this.isDrawing = false;
    }

    clearNotepad() {
        if (this.ctx && this.canvas) {
            this.ctx.fillStyle = 'white';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            console.log('✓ Canvas cleared');
        }
    }

    submitDrawing() {
        if (!this.canvas) {
            alert('No drawing to submit!');
            return;
        }

        // Convert canvas to PNG
        const dataURL = this.canvas.toDataURL('image/png');

        // Add to drawings array
        const drawing = {
            id: Date.now(),
            dataURL: dataURL,
            timestamp: new Date().toLocaleString()
        };

        this.drawings.push(drawing);

        console.log('✓ Drawing submitted:', drawing.timestamp);

        // Clear canvas
        this.clearNotepad();

        // Open gallery to show submission
        this.openGallery();

        alert('Drawing submitted to gallery!');
    }

    closeNotepad() {
        if (window.windowManager) {
            window.windowManager.hideWindow('notepadWindow');
        } else {
            const notepadWindow = document.getElementById('notepadWindow');
            if (notepadWindow) {
                notepadWindow.classList.remove('active');
            }
        }
    }

    // ========================================
    // GALLERY APP
    // ========================================

    openGallery() {
        if (window.windowManager) {
            window.windowManager.showWindow('galleryWindow');
        } else {
            const galleryWindow = document.getElementById('galleryWindow');
            if (galleryWindow) {
                galleryWindow.classList.add('active');
            }
        }
        this.renderGallery();
    }

    renderGallery() {
        const galleryGrid = document.getElementById('galleryGrid');
        if (!galleryGrid) return;

        // Clear existing content
        galleryGrid.innerHTML = '';

        if (this.drawings.length === 0) {
            galleryGrid.innerHTML = '<p style="color: #999; text-align: center; width: 100%; padding: 40px; margin: 0;">No drawings yet. Create one in Notepad!</p>';
            return;
        }

        // Render each drawing
        this.drawings.forEach((drawing, index) => {
            const item = document.createElement('div');
            item.className = 'gallery-item';

            const img = document.createElement('img');
            img.src = drawing.dataURL;
            img.alt = `Drawing ${index + 1}`;

            const caption = document.createElement('div');
            caption.className = 'gallery-caption';
            caption.textContent = drawing.timestamp;

            item.appendChild(img);
            item.appendChild(caption);
            galleryGrid.appendChild(item);
        });

        console.log('✓ Gallery rendered with', this.drawings.length, 'drawings');
    }

    closeGallery() {
        if (window.windowManager) {
            window.windowManager.hideWindow('galleryWindow');
        } else {
            const galleryWindow = document.getElementById('galleryWindow');
            if (galleryWindow) {
                galleryWindow.classList.remove('active');
            }
        }
    }
}

// Initialize apps when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.desktopApps = new DesktopApps();
    });
} else {
    window.desktopApps = new DesktopApps();
}
