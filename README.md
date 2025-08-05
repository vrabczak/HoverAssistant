# Helicopter Hover Assistant

A single-page web application designed to assist helicopter pilots in maintaining precise hover positions using GPS positioning. The app displays a visual grid and concentric circles to help pilots keep their aircraft centered on a marked reference point.

## Features

- **GPS-based positioning** with maximum precision and refresh rate
- **Visual grid display** (1-meter scale, 5-meter range)
- **Concentric circles** (1-meter diameter increments, 5 total)
- **Real-time position indicator** showing current location relative to marked position
- **Offline capability** - runs as a single HTML file
- **Mobile-optimized** interface for use on tablets and smartphones
- **Scalable architecture** for future feature additions

## Requirements

- Modern web browser with GPS/geolocation support
- Mobile device with GPS capability
- Location permission granted to the application

## Installation & Build

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```
   This creates a single HTML file at `dist/helicopter-hover-assistant.html`

3. **Development mode:**
   ```bash
   npm run dev
   ```

4. **Development server:**
   ```bash
   npm run serve
   ```

## Usage

1. **Deploy the app:** Copy the built HTML file to your mobile device
2. **Open the app:** Launch the HTML file in your mobile browser
3. **Grant permissions:** Allow location access when prompted
4. **Mark reference point:** Press "Mark Position" to set your hover target
5. **Monitor position:** Keep the orange dot centered on the display
6. **Reset if needed:** Use "Reset" to clear the reference point

### Display Elements

- **White crosshairs:** Marked reference position (hover target)
- **Green grid:** 1-meter scale grid extending 5 meters in each direction
- **Green circles:** Distance rings at 1m, 2m, 3m, 4m, and 5m radius
- **Orange pulsing dot:** Current aircraft position
- **Distance/Bearing:** Numerical readout of offset from target

## Architecture

The application follows a modular, event-driven architecture designed for scalability:

### Core Components

#### `HoverAssistant` (Main Controller)
- Central application coordinator
- Manages component lifecycle and communication
- Handles position calculations and updates

#### `GPSManager`
- Manages geolocation API interactions
- Handles permission requests and error states
- Provides high-precision position updates

#### `DisplayManager`
- Canvas-based visualization rendering
- Real-time grid, circles, and position display
- Responsive scaling and animation

#### `UIManager`
- User interface event handling
- Status updates and modal management
- Mobile-optimized touch interactions

#### `SettingsManager`
- Configuration management with persistence
- Validation and default value handling
- Extensible for future settings

### Event System

Components communicate through a clean event-driven architecture:

```javascript
// GPS events
gpsManager.addEventListener('position', handlePositionUpdate);
gpsManager.addEventListener('error', handleGPSError);

// UI events
uiManager.addEventListener('ui:mark', handleMarkPosition);
uiManager.addEventListener('ui:reset', handleReset);
```

### File Structure

```
src/
├── index.js              # Application entry point
├── index.html            # HTML template
├── styles.css            # Application styles
└── core/
    ├── HoverAssistant.js  # Main controller
    ├── GPSManager.js      # GPS handling
    ├── DisplayManager.js  # Canvas visualization
    ├── UIManager.js       # UI interactions
    └── SettingsManager.js # Configuration
```

## Configuration

The app includes comprehensive settings management for future extensibility:

### GPS Settings
- `enableHighAccuracy`: Maximum GPS precision
- `timeout`: Position request timeout
- `maximumAge`: Cache duration for positions
- `updateInterval`: Minimum time between updates

### Display Settings
- `gridSize`: Grid extent in meters
- `circleCount`: Number of distance circles
- `dotSize`: Position indicator size
- Animation and visual preferences

### UI Settings
- Theme selection
- Language preferences
- Vibration and sound options
- Screen wake lock behavior

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Safari:** Full support (iOS 13.4+)
- **Firefox:** Full support
- **Requirements:** ES6 modules, Canvas API, Geolocation API, Local Storage

## Security & Privacy

- **Location data:** Processed locally, never transmitted
- **Offline operation:** No network requirements after initial load
- **No tracking:** No analytics or external services
- **Local storage:** Settings saved locally on device

## Future Extensions

The modular architecture supports easy addition of new features:

- **Multiple reference points:** Support for waypoint navigation
- **Flight logging:** Position history and track recording
- **Advanced settings:** Customizable display options
- **Export functionality:** Position data export capabilities
- **Multi-language support:** Internationalization framework
- **Sound alerts:** Audio feedback for position deviations

## Development

### Adding New Features

1. **Create new manager class** in `src/core/`
2. **Integrate with main controller** via event system
3. **Add settings** to `SettingsManager`
4. **Update UI** as needed in `UIManager`
5. **Test thoroughly** on target mobile devices

### Event-Driven Development

```javascript
// Example: Adding a new feature
class NewFeatureManager {
    constructor() {
        this.eventTarget = new EventTarget();
    }
    
    emit(event, data) {
        this.eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
    }
    
    addEventListener(event, callback) {
        this.eventTarget.addEventListener(event, callback);
    }
}
```

## Troubleshooting

### GPS Issues
- Ensure location permissions are granted
- Check GPS signal strength
- Try refreshing the application
- Verify device GPS functionality

### Display Issues
- Check browser compatibility
- Ensure JavaScript is enabled
- Try different screen orientations
- Clear browser cache

### Performance Issues
- Close other applications using GPS
- Ensure sufficient device battery
- Check for browser updates

## License

MIT License - See LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on mobile devices
5. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section
- Review browser console for errors
- Ensure all requirements are met
- Test on different devices/browsers

## GitHub Pages Deployment

The application is deployed on GitHub Pages for easy access and testing.

### 🚀 Live Demo

**Access the app:** [https://vrabczak.github.io/HoverAssistant](https://vrabczak.github.io/HoverAssistant)

### Mobile Installation

1. Open the live demo link on your mobile device
2. Grant location permissions when prompted
3. Add to Home Screen for PWA experience:
   - Chrome: Menu (⋮) → "Add to Home screen"
   - Safari: Share button → "Add to Home Screen"

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. Serve locally for development: `npm run serve`
