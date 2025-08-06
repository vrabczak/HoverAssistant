# Helicopter Hover Assistant

A single-page web application designed to assist helicopter pilots in maintaining precise hover positions using GPS positioning. The app displays a visual grid, concentric circles, and an **interactive compass** to help pilots keep their aircraft centered on a marked reference point with selectable heading orientation.

## Features

- **GPS-based positioning** with maximum precision and refresh rate
- **Interactive compass heading selection** with intuitive drag controls
- **Day/Night theme system** with automatic detection and manual toggle
- **Visual grid display** (1-meter scale, 5-meter range)
- **Concentric circles** (1-meter diameter increments, 4 total + compass ring)
- **Real-time position indicator** showing current location relative to marked position
- **Heading-relative navigation** - position display rotates with selected compass heading
- **Cardinal direction labels** (N/S/E/W) that rotate with compass orientation
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
   npm run Build & Run
   ```
   This creates a single HTML file at `dist/index.html`

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
- **Green circles:** Distance rings at 1m, 2m, 3m, and 4m radius
- **Compass ring:** Outer 5m circle with interactive heading selection
- **N/S/E/W labels:** Cardinal directions that rotate with selected heading
- **HDG display:** Current heading value shown at top of compass
- **Orange pulsing dot:** Current aircraft position (rotates with heading)
- **Distance/Bearing:** Numerical readout of offset from target (bearing relative to true north)

### Interactive Compass Controls

The compass supports intuitive drag-based heading selection:

- **Drag anywhere on the canvas** to rotate the compass heading
- **Drag direction determines rotation** based on position relative to center:
  - **Top area**: Drag left = counter-clockwise, right = clockwise
  - **Bottom area**: Drag left = clockwise, right = counter-clockwise  
  - **Left area**: Drag up = clockwise, down = counter-clockwise
  - **Right area**: Drag up = counter-clockwise, down = clockwise
- **Visual feedback**: HDG label updates in real-time, N/S/E/W labels rotate
- **Navigation**: Position dot rotates with heading for intuitive orientation

### Theme System (Day/Night Mode)

The app features a comprehensive theme system optimized for different lighting conditions:

#### Theme Toggle
- **Theme button**: Located in the control panel ( icon)
- **One-click switching**: Toggle between day and night modes instantly
- **Keyboard accessible**: Use Enter or Space key to toggle themes
- **Persistent preference**: Theme choice is saved and restored on app restart

#### Automatic Detection
- **System preference detection**: Automatically detects device's dark/light mode preference
- **Smart defaults**: Defaults to night mode for helicopter operations
- **Seamless integration**: Works with mobile browser theme-color meta tag

#### Theme Characteristics
- **Night Mode (Dark Theme)**:
  - Dark gradient backgrounds for reduced eye strain
  - High contrast green elements for visibility
  - Optimized for low-light cockpit environments
  - Default mode for helicopter operations

- **Day Mode (Light Theme)**:
  - Light backgrounds for bright daylight conditions
  - Darker text and borders for better readability
  - Maintains green accent colors for consistency
  - Ideal for outdoor daytime operations

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

#### `CompassController`
- Handles intuitive drag-based compass rotation
- Mouse and touch event management
- Quadrant-based rotation logic for natural interaction
- Configurable sensitivity for precise control

#### `DisplayManager`
- Canvas-based visualization rendering
- Real-time grid, circles, compass, and position display
- Heading-relative position rotation
- Responsive scaling and animation

#### `UIManager`
- User interface event handling
- Status updates and modal management
- Mobile-optimized touch interactions

#### `SettingsManager`
- Configuration management with persistence
- Validation and default value handling
- Extensible for future settings

#### `ThemeManager`
- Day/night mode switching with system detection
- Theme persistence and user preference management
- CSS custom properties for consistent theming
- Mobile browser integration with theme-color updates

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
    ├── HoverAssistant.js     # Main controller
    ├── GPSManager.js         # GPS handling
    ├── CompassController.js  # Interactive compass controls
    ├── DisplayManager.js     # Canvas visualization
    ├── UIManager.js          # UI interactions
    ├── SettingsManager.js    # Configuration
    └── ThemeManager.js       # Theme system
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
- `circleCount`: Number of distance circles (4 inner + compass ring)
- `dotSize`: Position indicator size
- `compassSensitivity`: Drag sensitivity for heading selection
- Animation and visual preferences

### UI Settings
- **Theme selection**: Day/night mode with automatic detection
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
- **Advanced compass features:** Magnetic declination, wind correction
- **Heading presets:** Quick selection of common headings
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

### Live Demo

**Access the app:** [https://vrabczak.github.io/HoverAssistant](https://vrabczak.github.io/HoverAssistant)

### Mobile Installation

1. Open the live demo link on your mobile device
2. Grant location permissions when prompted
3. Add to Home Screen for PWA experience:
   - Chrome: Menu (⋮) → "Add to Home screen"
   - Safari: Share button → "Add to Home Screen"

### Development Setup

1. Clone the repository
2. Build and run the application: `npm run Build & Run`
